const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Payment = require('../models/Payment');
const moment = require('moment');

// @route   POST /api/appointments/book
// @desc    Book appointment (Patient)
// @access  Private (Patient)
router.post('/book', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { doctor, department, appointmentDate, timeSlot, reason } = req.body;
    // Basic validation before hitting Mongo schema
    if (!doctor || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: 'Doctor, date and time slot are required.' });
    }

    // Check if doctor exists and is active
    const doctorDoc = await User.findById(doctor);
    if (!doctorDoc || doctorDoc.role !== 'doctor' || !doctorDoc.isActive) {
      return res.status(404).json({ message: 'Doctor not found or inactive' });
    }
    
    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: moment(appointmentDate).startOf('day').toDate(),
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }
    
    // Get next token number for the day
    const todayStart = moment(appointmentDate).startOf('day');
    const todayEnd = moment(appointmentDate).endOf('day');
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: todayStart.toDate(), $lte: todayEnd.toDate() },
      doctor
    });
    
    const appointment = new Appointment({
      patient: req.user._id,
      doctor,
      department: department || doctorDoc.department,
      appointmentDate: moment(appointmentDate).toDate(),
      timeSlot,
      tokenNumber: todayAppointments + 1,
      reason,
      createdBy: req.user._id
    });
    
    await appointment.save();
    
    // Create payment record
    const payment = new Payment({
      patient: req.user._id,
      appointment: appointment._id,
      paymentType: 'appointment',
      amount: doctorDoc.consultationFees || 0,
      paymentMode: 'pending',
      paymentStatus: 'pending'
    });
    
    await payment.save();
    
    appointment.paymentAmount = payment.amount;
    await appointment.save();
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name email phone department consultationFees')
      .populate('patient', 'name email phone');
    
    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments/available-slots
// @desc    Get available time slots for a doctor
// @access  Private (Patient)
router.get('/available-slots', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { doctor, date } = req.query;
    
    if (!doctor || !date) {
      return res.status(400).json({ message: 'Doctor and date are required' });
    }
    
    const doctorDoc = await User.findById(doctor);
    if (!doctorDoc || doctorDoc.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Generate time slots based on working hours
    const workingHours = doctorDoc.workingHours || { start: '09:00', end: '17:00' };
    const breakTime = doctorDoc.breakTime || { start: '13:00', end: '14:00' };
    
    const slots = [];
    const start = moment(`${date} ${workingHours.start}`, 'YYYY-MM-DD HH:mm');
    const end = moment(`${date} ${workingHours.end}`, 'YYYY-MM-DD HH:mm');
    const breakStart = moment(`${date} ${breakTime.start}`, 'YYYY-MM-DD HH:mm');
    const breakEnd = moment(`${date} ${breakTime.end}`, 'YYYY-MM-DD HH:mm');
    
    let current = start.clone();
    while (current.isBefore(end)) {
      // Skip break time
      if (current.isBetween(breakStart, breakEnd)) {
        current.add(30, 'minutes');
        continue;
      }
      
      slots.push(current.format('HH:mm'));
      current.add(30, 'minutes');
    }
    
    // Get booked slots
    const appointmentDate = moment(date).startOf('day');
    const bookedAppointments = await Appointment.find({
      doctor,
      appointmentDate: {
        $gte: appointmentDate.toDate(),
        $lt: moment(appointmentDate).endOf('day').toDate()
      },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);
    
    // Filter available slots
    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));
    
    res.json({ availableSlots, bookedSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private (Patient, Doctor, Admin)
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check permissions
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (!['admin', 'doctor', 'patient'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    // Delete associated payment record(s) for this appointment
    await Payment.deleteMany({ appointment: appointment._id });
    await Appointment.findByIdAndDelete(id);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments
// @desc    Get appointments (based on role)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    // Admin can see all
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email department')
      .sort({ appointmentDate: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

