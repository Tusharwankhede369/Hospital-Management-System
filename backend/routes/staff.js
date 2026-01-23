const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Room = require('../models/Room');
const Report = require('../models/Report');
const Payment = require('../models/Payment');
const MedicineSchedule = require('../models/MedicineSchedule');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reports/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// @route   GET /api/staff/profile
// @desc    Get staff profile
// @access  Private (Staff)
router.get('/profile', authenticate, authorize('staff'), async (req, res) => {
  try {
    const staff = await User.findById(req.user._id).select('-password');
    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff/patient-entry
// @desc    Add walk-in patient
// @access  Private (Staff - Receptionist)
router.post('/patient-entry', authenticate, authorize('staff'), async (req, res) => {
  try {
    if (req.user.staffType !== 'receptionist') {
      return res.status(403).json({ message: 'Only receptionist can add patients' });
    }
    
    const { name, email, phone, address, gender, dateOfBirth, bloodGroup, emergencyContact } = req.body;
    
    // Check if patient exists
    let patient = await User.findOne({ email, role: 'patient' });
    
    if (!patient) {
      // Create new patient
      const tempPassword = Math.random().toString(36).slice(-8);
      patient = new User({
        name,
        email,
        password: tempPassword,
        phone,
        role: 'patient',
        address,
        gender,
        dateOfBirth,
        bloodGroup,
        emergencyContact
      });
      await patient.save();
    } else {
      // Update existing patient
      if (name) patient.name = name;
      if (phone) patient.phone = phone;
      if (address) patient.address = address;
      if (gender) patient.gender = gender;
      if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
      if (bloodGroup) patient.bloodGroup = bloodGroup;
      if (emergencyContact) patient.emergencyContact = emergencyContact;
      await patient.save();
    }
    
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/rooms
// @desc    Get all rooms
// @access  Private (Staff)
router.get('/rooms', authenticate, authorize('staff'), async (req, res) => {
  try {
    const rooms = await Room.find().populate('beds.patient', 'name');
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff/assign-room
// @desc    Assign room/bed to patient
// @access  Private (Staff - Ward staff)
router.post('/assign-room', authenticate, authorize('staff'), async (req, res) => {
  try {
    const { patient, room, bedNumber } = req.body;
    
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const bed = roomDoc.beds.find(b => b.bedNumber === bedNumber);
    if (!bed || bed.status !== 'available') {
      return res.status(400).json({ message: 'Bed not available' });
    }
    
    bed.status = 'occupied';
    bed.patient = patient;
    bed.assignedDate = new Date();
    
    const allOccupied = roomDoc.beds.every(b => b.status === 'occupied');
    if (allOccupied) roomDoc.status = 'occupied';
    
    await roomDoc.save();
    res.json({ message: 'Room assigned successfully', room: roomDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff/discharge
// @desc    Discharge patient
// @access  Private (Staff)
router.post('/discharge', authenticate, authorize('staff'), async (req, res) => {
  try {
    const { patient, room, bedNumber } = req.body;
    
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const bed = roomDoc.beds.find(b => b.bedNumber === bedNumber);
    if (bed) {
      bed.status = 'available';
      bed.patient = null;
      bed.assignedDate = null;
    }
    
    roomDoc.status = 'available';
    await roomDoc.save();
    
    res.json({ message: 'Patient discharged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/medicine-schedules
// @desc    Get medicine schedules (Nurse)
// @access  Private (Staff - Nurse)
router.get('/medicine-schedules', authenticate, authorize('staff'), async (req, res) => {
  try {
    const schedules = await MedicineSchedule.find({ status: 'active' })
      .populate('patient', 'name')
      .populate('medicine')
      .sort({ startDate: -1 });
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/staff/medicine-schedule/:id/mark-given
// @desc    Mark medicine as given
// @access  Private (Staff - Nurse)
router.put('/medicine-schedule/:id/mark-given', authenticate, authorize('staff'), async (req, res) => {
  try {
    const { timing, given } = req.body; // timing: 'morning', 'afternoon', 'night'
    
    const schedule = await MedicineSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    if (schedule.timing[timing]) {
      schedule.timing[timing].given = given;
      if (given) {
        schedule.timing[timing].givenAt = new Date();
        schedule.timing[timing].givenBy = req.user._id;
      }
    }
    
    await schedule.save();
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff/upload-report
// @desc    Upload lab report (Lab staff)
// @access  Private (Staff - Lab staff)
router.post('/upload-report', authenticate, authorize('staff'), upload.single('reportFile'), async (req, res) => {
  try {
    if (req.user.staffType !== 'lab_staff') {
      return res.status(403).json({ message: 'Only lab staff can upload reports' });
    }
    
    const { patient, doctor, appointment, testType, testName, testResults, notes } = req.body;
    
    const report = new Report({
      patient,
      doctor,
      appointment,
      testType,
      testName,
      reportFile: req.file ? req.file.path : null,
      testResults,
      uploadedBy: req.user._id,
      status: 'completed',
      notes
    });
    
    await report.save();
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff/cash-payment
// @desc    Record cash payment (Receptionist)
// @access  Private (Staff - Receptionist)
router.post('/cash-payment', authenticate, authorize('staff'), async (req, res) => {
  try {
    if (req.user.staffType !== 'receptionist') {
      return res.status(403).json({ message: 'Only receptionist can record cash payments' });
    }
    
    const { patient, appointment, paymentType, amount, notes } = req.body;
    
    const payment = new Payment({
      patient,
      appointment,
      paymentType,
      amount,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      receivedBy: req.user._id,
      notes
    });
    
    await payment.save();
    
    // Update appointment payment status if exists
    if (appointment) {
      const apt = await Appointment.findById(appointment);
      if (apt) {
        apt.paymentStatus = 'paid';
        apt.paymentAmount = amount;
        await apt.save();
      }
    }
    
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

