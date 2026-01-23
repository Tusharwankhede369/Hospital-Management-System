const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const PatientRecord = require('../models/PatientRecord');
const User = require('../models/User');
const Report = require('../models/Report');
const Room = require('../models/Room');
const moment = require('moment');

// @route   GET /api/doctor/profile
// @desc    Get doctor profile
// @access  Private (Doctor)
router.get('/profile', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id).select('-password');
    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/doctor/profile
// @desc    Update doctor profile
// @access  Private (Doctor)
router.put('/profile', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { qualification, department, experience, consultationFees, workingDays, workingHours, breakTime } = req.body;
    
    const doctor = await User.findById(req.user._id);
    if (qualification) doctor.qualification = qualification;
    if (department) doctor.department = department;
    if (experience) doctor.experience = experience;
    if (consultationFees) doctor.consultationFees = consultationFees;
    if (workingDays) doctor.workingDays = workingDays;
    if (workingHours) doctor.workingHours = workingHours;
    if (breakTime) doctor.breakTime = breakTime;
    
    await doctor.save();
    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctor/appointments
// @desc    Get doctor appointments
// @access  Private (Doctor)
router.get('/appointments', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { status, date } = req.query;
    const query = { doctor: req.user._id };
    
    if (status) query.status = status;
    if (date) {
      const startDate = moment(date).startOf('day');
      const endDate = moment(date).endOf('day');
      query.appointmentDate = { $gte: startDate, $lte: endDate };
    }
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone gender dateOfBirth bloodGroup')
      .sort({ appointmentDate: 1, timeSlot: 1 });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/doctor/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Doctor)
router.put('/appointments/:id/status', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment || appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();
    
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/doctor/patient-record
// @desc    Create/Update patient record
// @access  Private (Doctor)
router.post('/patient-record', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { patient, appointment, diagnosis, symptoms, treatmentPlan, prescriptions, followUpDate, notes } = req.body;
    
    let record = await PatientRecord.findOne({ patient, appointment });
    
    if (record) {
      // Update existing record
      if (diagnosis) record.diagnosis = diagnosis;
      if (symptoms) record.symptoms = symptoms;
      if (treatmentPlan) record.treatmentPlan = treatmentPlan;
      if (prescriptions) record.prescriptions = prescriptions;
      if (followUpDate) record.followUpDate = followUpDate;
      if (notes) record.notes = notes;
      record.updatedBy = req.user._id;
    } else {
      // Create new record
      record = new PatientRecord({
        patient,
        doctor: req.user._id,
        appointment,
        diagnosis,
        symptoms,
        treatmentPlan,
        prescriptions,
        followUpDate,
        notes,
        updatedBy: req.user._id
      });
    }
    
    await record.save();
    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctor/patient-records
// @desc    Get patient records
// @access  Private (Doctor)
router.get('/patient-records', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { patientId } = req.query;
    const query = { doctor: req.user._id };
    if (patientId) query.patient = patientId;
    
    const records = await PatientRecord.find(query)
      .populate('patient', 'name email phone gender dateOfBirth bloodGroup')
      .populate('appointment')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/doctor/admit-patient
// @desc    Admit patient
// @access  Private (Doctor)
router.post('/admit-patient', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { patient, room, bedNumber, notes } = req.body;
    
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const bed = roomDoc.beds.find(b => b.bedNumber === bedNumber);
    if (!bed || bed.status !== 'available') {
      return res.status(400).json({ message: 'Bed not available' });
    }
    
    // Update bed status
    bed.status = 'occupied';
    bed.patient = patient;
    bed.assignedDate = new Date();
    
    // Update room status if all beds occupied
    const allOccupied = roomDoc.beds.every(b => b.status === 'occupied');
    if (allOccupied) roomDoc.status = 'occupied';
    
    await roomDoc.save();
    
    // Update patient record
    let record = await PatientRecord.findOne({ patient });
    if (record) {
      record.isAdmitted = true;
      record.room = room;
      record.bedNumber = bedNumber;
      record.admissionDate = new Date();
      if (notes) {
        record.dailyNotes.push({
          date: new Date(),
          note: notes,
          addedBy: req.user._id
        });
      }
      await record.save();
    }
    
    res.json({ message: 'Patient admitted successfully', room: roomDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/doctor/daily-notes
// @desc    Add daily notes for admitted patient
// @access  Private (Doctor)
router.post('/daily-notes', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { patientRecordId, note } = req.body;
    
    const record = await PatientRecord.findById(patientRecordId);
    if (!record || record.doctor.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    record.dailyNotes.push({
      date: new Date(),
      note,
      addedBy: req.user._id
    });
    
    await record.save();
    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/doctor/request-lab-test
// @desc    Request lab test
// @access  Private (Doctor)
router.post('/request-lab-test', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { patient, appointment, testType, testName, notes } = req.body;
    
    const report = new Report({
      patient,
      doctor: req.user._id,
      appointment,
      testType,
      testName,
      status: 'pending',
      notes
    });
    
    await report.save();
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctor/lab-reports
// @desc    Get lab reports
// @access  Private (Doctor)
router.get('/lab-reports', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { patientId } = req.query;
    const query = { doctor: req.user._id };
    if (patientId) query.patient = patientId;
    
    const reports = await Report.find(query)
      .populate('patient', 'name email phone')
      .populate('appointment')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

