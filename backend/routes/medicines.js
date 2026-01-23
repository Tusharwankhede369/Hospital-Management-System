const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const MedicineSchedule = require('../models/MedicineSchedule');
const PatientRecord = require('../models/PatientRecord');

// @route   POST /api/medicines
// @desc    Create medicine (Admin)
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, type, stockQuantity, price, manufacturer, expiryDate, description } = req.body;
    
    const medicine = new Medicine({
      name,
      type,
      stockQuantity: stockQuantity || 0,
      price,
      manufacturer,
      expiryDate,
      description
    });
    
    await medicine.save();
    res.status(201).json(medicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medicines
// @desc    Get all medicines
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const medicines = await Medicine.find(query).sort({ name: 1 });
    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medicines/:id
// @desc    Get medicine by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/medicines/:id
// @desc    Update medicine
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, type, stockQuantity, price, manufacturer, expiryDate, description } = req.body;
    
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    if (name) medicine.name = name;
    if (type) medicine.type = type;
    if (stockQuantity !== undefined) medicine.stockQuantity = stockQuantity;
    if (price !== undefined) medicine.price = price;
    if (manufacturer) medicine.manufacturer = manufacturer;
    if (expiryDate) medicine.expiryDate = expiryDate;
    if (description) medicine.description = description;
    
    await medicine.save();
    res.json(medicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/medicines/:id
// @desc    Delete medicine
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/medicines/schedule
// @desc    Create medicine schedule from prescription
// @access  Private (Doctor, Staff)
router.post('/schedule', authenticate, authorize('doctor', 'staff'), async (req, res) => {
  try {
    const { patientRecordId, prescriptions } = req.body;
    
    const patientRecord = await PatientRecord.findById(patientRecordId);
    if (!patientRecord) {
      return res.status(404).json({ message: 'Patient record not found' });
    }
    
    const schedules = [];
    
    for (const prescription of prescriptions) {
      const { medicine, medicineName, dosage, timing, duration, frequency } = prescription;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);
      
      // Parse timing
      const timingObj = {
        morning: timing.includes('morning') ? { time: '09:00', beforeFood: timing.includes('before_food') } : null,
        afternoon: timing.includes('afternoon') ? { time: '14:00', beforeFood: timing.includes('before_food') } : null,
        night: timing.includes('night') ? { time: '20:00', beforeFood: timing.includes('before_food') } : null
      };
      
      const schedule = new MedicineSchedule({
        patient: patientRecord.patient,
        patientRecord: patientRecordId,
        medicine,
        medicineName,
        dosage,
        timing: timingObj,
        duration,
        startDate,
        endDate
      });
      
      await schedule.save();
      schedules.push(schedule);
    }
    
    res.status(201).json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

