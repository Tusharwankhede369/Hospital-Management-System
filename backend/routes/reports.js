const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { authenticate, authorize } = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');
const { analyzeMedicalText, buildInsights } = require('../utils/medicalAnalyzer');
const { analyzeWithPython } = require('../services/pythonClient');

// Configure multer for doctor/admin uploads (PDF reports)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'reports');
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      cb(err, uploadDir);
    });
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are supported for analysis right now.'));
    }
    cb(null, true);
  }
});

// @route   GET /api/reports
// @desc    Get reports
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    // Admin and staff can see all

    const reports = await Report.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name')
      .populate('appointment')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/patients
// @desc    Get list of patients for analyzer dropdown
// @access  Private (Doctor, Admin)
router.get('/patients', authenticate, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('name email phone _id')
      .sort({ name: 1 });
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name')
      .populate('appointment');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && report.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/analyze
// @desc    Upload and analyze medical report (OCR + ranges)
// @access  Private (Doctor, Admin)
router.post(
  '/analyze',
  authenticate,
  authorize('doctor', 'admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      const extractedText = pdfData.text || '';

      // Use Python analyzer only (with OCR support via file path)
      let analysis = [];
      try {
        // In deployments, the Python service cannot access this Node server's local file path.
        // So we primarily send extracted text. OCR-from-file-path works only when both run on same machine.
        const allowFilePath = process.env.PYTHON_ALLOW_FILE_PATH === 'true';
        const pyResult = await analyzeWithPython(extractedText, allowFilePath ? req.file.path : null);
        if (pyResult && Array.isArray(pyResult.analysis)) {
          analysis = pyResult.analysis.map((p) => ({
            parameter: p.name || p.parameter || '',
            value: p.value,
            unit: p.unit || '',
            // only allow values supported by Report schema enum
            status: (() => {
              const raw = (p.status || '').toLowerCase();
              return ['low', 'normal', 'high'].includes(raw) ? raw : 'normal';
            })(),
            range:
              p.min != null || p.max != null
                ? {
                    min: p.min,
                    max: p.max,
                    text:
                      p.min != null && p.max != null
                        ? `${p.min}–${p.max}${p.unit ? ' ' + p.unit : ''}`
                        : ''
                  }
                : undefined
          }));
        }
      } catch (e) {
        console.error('Python analyzer error:', e.message);
      }

      // Fallback: if Python analysis failed/empty, analyze locally from extracted PDF text.
      if (!analysis || analysis.length === 0) {
        try {
          const local = analyzeMedicalText(extractedText || '');
          analysis = Array.isArray(local)
            ? local.map((p) => ({
                parameter: p.parameter || '',
                value: p.value,
                unit: p.unit || '',
                status: ['low', 'normal', 'high'].includes(String(p.status || '').toLowerCase())
                  ? String(p.status).toLowerCase()
                  : 'normal',
                range: p.range
              }))
            : [];
        } catch (e) {
          console.error('Local analyzer error:', e.message);
        }
      }

      const insights = buildInsights(analysis || []);

      // Optionally save as a Report record linked to a patient if provided
      const { patient, testType, testName, notes } = req.body;
      let savedReport = null;
      let patientDetails = null;

      if (patient) {
        patientDetails = await User.findById(patient).select('name email phone _id');
      }

      if (patient && testType && testName) {
        savedReport = new Report({
          patient,
          doctor: req.user.role === 'doctor' ? req.user._id : undefined,
          testType,
          testName,
          reportFile: req.file.path,
          testResults: '',
          uploadedBy: req.user._id,
          status: 'completed',
          notes: notes || '',
          ocrText: extractedText,
          analysis
        });

        await savedReport.save();
      }

      res.json({
        message: 'Report analyzed successfully',
        reportId: savedReport ? savedReport._id : null,
        patient: patientDetails,
        extractedText,
        analysis,
        insights
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Failed to analyze report' });
    }
  }
);

module.exports = router;

