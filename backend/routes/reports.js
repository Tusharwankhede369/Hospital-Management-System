const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Report = require('../models/Report');

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

module.exports = router;

