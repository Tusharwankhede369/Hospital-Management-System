const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');

// @route   POST /api/payments
// @desc    Create payment
// @access  Private (Patient, Staff, Admin)
router.post('/', authenticate, authorize('patient', 'staff', 'admin'), async (req, res) => {
  try {
    const { appointment, paymentType, amount, paymentMode, transactionId, notes } = req.body;
    
    const payment = new Payment({
      patient: req.user.role === 'patient' ? req.user._id : req.body.patient,
      appointment,
      paymentType,
      amount,
      paymentMode,
      transactionId,
      paymentStatus: paymentMode === 'cash' ? 'paid' : 'pending',
      paidBy: req.user.role === 'patient' ? req.user._id : null,
      receivedBy: req.user.role === 'staff' ? req.user._id : null,
      notes
    });
    
    await payment.save();
    
    // Update appointment payment status
    if (appointment) {
      const apt = await Appointment.findById(appointment);
      if (apt) {
        apt.paymentStatus = payment.paymentStatus;
        apt.paymentAmount = amount;
        await apt.save();
      }
    }
    
    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments
// @desc    Get payments
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    }
    // Admin and staff can see all
    
    const payments = await Payment.find(query)
      .populate('patient', 'name email')
      .populate('appointment')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('appointment')
      .populate('receivedBy', 'name');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check permissions
    if (req.user.role === 'patient' && payment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payments/:id/status
// @desc    Update payment status
// @access  Private (Admin, Staff)
router.put('/:id/status', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    payment.paymentStatus = paymentStatus;
    await payment.save();
    
    // Update appointment payment status
    if (payment.appointment) {
      const apt = await Appointment.findById(payment.appointment);
      if (apt) {
        apt.paymentStatus = paymentStatus;
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

