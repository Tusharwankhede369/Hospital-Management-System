const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Room = require('../models/Room');
const Salary = require('../models/Salary');
const moment = require('moment');

// @route   POST /api/admin/create-user
// @desc    Create user (Doctor/Staff/HR)
// @access  Private (Admin)
router.post('/create-user', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, role, ...roleSpecificFields } = req.body;
    
    if (!['doctor', 'staff', 'hr'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Can only create doctor, staff, or hr' });
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    user = new User({
      name,
      email,
      password: password || 'Default@123', // Default password
      phone,
      role,
      ...roleSpecificFields
    });
    
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { name, email, phone, isActive, ...otherFields } = req.body;
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Update role-specific fields
    Object.keys(otherFields).forEach(key => {
      if (otherFields[key] !== undefined) {
        user[key] = otherFields[key];
      }
    });
    
    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin)
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = false;
    await user.save();
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const today = moment().startOf('day');
    const thisMonth = moment().startOf('month');
    
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
    
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: today.toDate() }
    });
    
    const monthlyAppointments = await Appointment.countDocuments({
      createdAt: { $gte: thisMonth.toDate() }
    });
    
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth.toDate() },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalRevenue = monthlyRevenue[0]?.total || 0;
    
    // Doctor-wise income
    const doctorIncome = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth.toDate() },
          paymentStatus: 'paid',
          paymentType: 'appointment'
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointment',
          foreignField: '_id',
          as: 'appointment'
        }
      },
      {
        $unwind: '$appointment'
      },
      {
        $group: {
          _id: '$appointment.doctor',
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $project: {
          doctorName: '$doctor.name',
          total: 1
        }
      }
    ]);
    
    res.json({
      totalPatients,
      totalDoctors,
      totalStaff,
      todayAppointments,
      monthlyAppointments,
      monthlyRevenue: totalRevenue,
      doctorIncome
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/appointments
// @desc    Get all appointments
// @access  Private (Admin)
router.get('/appointments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, date, doctor } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (date) {
      const startDate = moment(date).startOf('day');
      const endDate = moment(date).endOf('day');
      query.appointmentDate = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    }
    if (doctor) query.doctor = doctor;
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name department')
      .sort({ appointmentDate: -1 });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/payments
// @desc    Get all payments
// @access  Private (Admin)
router.get('/payments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, paymentStatus } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const payments = await Payment.find(query)
      .populate('patient', 'name email')
      .populate('appointment')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/salary/:id/approve
// @desc    Approve salary
// @access  Private (Admin)
router.put('/salary/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    salary.status = 'approved';
    salary.approvedBy = req.user._id;
    await salary.save();
    
    res.json(salary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/salary/:id/mark-paid
// @desc    Mark salary as paid
// @access  Private (Admin)
router.put('/salary/:id/mark-paid', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { paymentMode } = req.body;
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    if (salary.status !== 'approved') {
      return res.status(400).json({ message: 'Salary must be approved first' });
    }
    
    salary.status = 'paid';
    salary.paidDate = new Date();
    if (paymentMode) salary.paymentMode = paymentMode;
    await salary.save();
    
    res.json(salary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/salaries
// @desc    Get all salary records
// @access  Private (Admin)
router.get('/salaries', authenticate, authorize('admin'), async (req, res) => {
  try {
    const salaries = await Salary.find()
      .populate('employee', 'name email role')
      .populate('preparedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ year: -1, month: -1 });
    res.json(salaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

