const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Salary = require('../models/Salary');

// @route   GET /api/hr/staff
// @desc    Get all staff records
// @access  Private (HR)
router.get('/staff', authenticate, authorize('hr'), async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password');
    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hr/doctors
// @desc    Get all doctors
// @access  Private (HR)
router.get('/doctors', authenticate, authorize('hr'), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/hr/salary
// @desc    Create salary record
// @access  Private (HR)
router.post('/salary', authenticate, authorize('hr'), async (req, res) => {
  try {
    const { employee, month, year, baseSalary, bonus, deduction, overtime, notes } = req.body;

    const monthNum = month !== undefined && month !== '' ? parseInt(month, 10) : new Date().getMonth() + 1;
    const yearNum = year !== undefined && year !== '' ? parseInt(year, 10) : new Date().getFullYear();

    if (!employee) {
      return res.status(400).json({ message: 'Employee is required' });
    }
    if (!baseSalary && baseSalary !== 0) {
      return res.status(400).json({ message: 'Base salary is required' });
    }

    const totalAmount = Number(baseSalary) + (Number(bonus) || 0) - (Number(deduction) || 0) + (Number(overtime) || 0);

    const salary = new Salary({
      employee,
      month: monthNum,
      year: yearNum,
      baseSalary: Number(baseSalary),
      bonus: Number(bonus) || 0,
      deduction: Number(deduction) || 0,
      overtime: Number(overtime) || 0,
      totalAmount,
      preparedBy: req.user._id,
      notes
    });

    await salary.save();
    res.json(salary);
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message || 'Validation failed' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hr/salaries
// @desc    Get all salary records
// @access  Private (HR)
router.get('/salaries', authenticate, authorize('hr'), async (req, res) => {
  try {
    const { employee, month, year, status } = req.query;
    const query = {};
    
    if (employee) query.employee = employee;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    
    const salaries = await Salary.find(query)
      .populate('employee', 'name email role staffType')
      .populate('preparedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ year: -1, month: -1 });
    res.json(salaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/hr/salary/:id
// @desc    Update salary record
// @access  Private (HR)
router.put('/salary/:id', authenticate, authorize('hr'), async (req, res) => {
  try {
    const { baseSalary, bonus, deduction, overtime, notes } = req.body;
    
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    if (salary.status === 'paid') {
      return res.status(400).json({ message: 'Cannot modify paid salary' });
    }
    
    if (baseSalary) salary.baseSalary = baseSalary;
    if (bonus !== undefined) salary.bonus = bonus;
    if (deduction !== undefined) salary.deduction = deduction;
    if (overtime !== undefined) salary.overtime = overtime;
    if (notes) salary.notes = notes;
    
    salary.totalAmount = salary.baseSalary + salary.bonus - salary.deduction + salary.overtime;
    
    await salary.save();
    res.json(salary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

