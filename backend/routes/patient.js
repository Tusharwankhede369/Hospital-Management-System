const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const PatientRecord = require('../models/PatientRecord');
const Payment = require('../models/Payment');
const Report = require('../models/Report');
const User = require('../models/User');
const MedicineSchedule = require('../models/MedicineSchedule');

// @route   GET /api/patient/profile
// @desc    Get patient profile
// @access  Private (Patient)
router.get('/profile', authenticate, authorize('patient'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/patient/profile
// @desc    Update patient profile
// @access  Private (Patient)
router.put('/profile', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { name, phone, address, gender, dateOfBirth, bloodGroup, emergencyContact, allergies, heightCm, weightKg } = req.body;
    
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (allergies !== undefined) {
      user.allergies = Array.isArray(allergies)
        ? allergies.map((item) => String(item).trim()).filter(Boolean)
        : String(allergies)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (heightCm !== undefined && heightCm !== '') user.heightCm = Number(heightCm);
    if (weightKg !== undefined && weightKg !== '') user.weightKg = Number(weightKg);
    
    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/appointments
// @desc    Get patient appointments
// @access  Private (Patient)
router.get('/appointments', authenticate, authorize('patient'), async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email phone department')
      .sort({ appointmentDate: -1 });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/doctors
// @desc    Get available doctors
// @access  Private (Patient)
router.get('/doctors', authenticate, authorize('patient'), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name email phone department qualification experience consultationFees workingDays workingHours');
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/reports
// @desc    Get patient reports
// @access  Private (Patient)
router.get('/reports', authenticate, authorize('patient'), async (req, res) => {
  try {
    const reports = await Report.find({ patient: req.user._id })
      .populate('doctor', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/prescriptions
// @desc    Get patient prescriptions
// @access  Private (Patient)
router.get('/prescriptions', authenticate, authorize('patient'), async (req, res) => {
  try {
    const records = await PatientRecord.find({ patient: req.user._id })
      .populate('doctor', 'name')
      .populate('appointment')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/medicine-schedule
// @desc    Get patient medicine schedule
// @access  Private (Patient)
router.get('/medicine-schedule', authenticate, authorize('patient'), async (req, res) => {
  try {
    const schedules = await MedicineSchedule.find({ patient: req.user._id, status: 'active' })
      .populate('medicine')
      .sort({ startDate: -1 });
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/patient/medicine-schedule/:id/mark-taken
// @desc    Patient marks a dose as taken
// @access  Private (Patient)
router.put('/medicine-schedule/:id/mark-taken', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { timing, given } = req.body;
    if (!['morning', 'afternoon', 'night'].includes(timing)) {
      return res.status(400).json({ message: 'Invalid timing' });
    }

    const schedule = await MedicineSchedule.findOne({
      _id: req.params.id,
      patient: req.user._id
    });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    if (!schedule.timing[timing]) {
      return res.status(400).json({ message: 'This dose is not prescribed' });
    }

    schedule.timing[timing].given = Boolean(given);
    schedule.timing[timing].givenAt = given ? new Date() : null;
    schedule.timing[timing].givenBy = given ? req.user._id : null;
    await schedule.save();
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/payments
// @desc    Get patient payment history
// @access  Private (Patient)
router.get('/payments', authenticate, authorize('patient'), async (req, res) => {
  try {
    const payments = await Payment.find({ patient: req.user._id })
      .populate('appointment')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/unpaid-appointments
// @desc    Get appointments that are not yet paid (for patient to pay here)
// @access  Private (Patient)
router.get('/unpaid-appointments', authenticate, authorize('patient'), async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
      paymentStatus: { $ne: 'paid' },
      status: { $in: ['confirmed', 'completed', 'pending'] }
    })
      .populate('doctor', 'name department consultationFees')
      .sort({ appointmentDate: -1 });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

