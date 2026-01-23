const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Room = require('../models/Room');

// @route   POST /api/rooms
// @desc    Create room (Admin)
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { roomNumber, roomType, floor, bedCount, charges } = req.body;
    
    const beds = [];
    for (let i = 1; i <= bedCount; i++) {
      beds.push({
        bedNumber: i,
        status: 'available'
      });
    }
    
    const room = new Room({
      roomNumber,
      roomType,
      floor,
      bedCount,
      beds,
      charges
    });
    
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private (Staff, Doctor, Admin)
router.get('/', authenticate, authorize('staff', 'doctor', 'admin'), async (req, res) => {
  try {
    const { roomType, status } = req.query;
    const query = {};
    
    if (roomType) query.roomType = roomType;
    if (status) query.status = status;
    
    const rooms = await Room.find(query)
      .populate('beds.patient', 'name')
      .sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private (Staff, Doctor, Admin)
router.get('/:id', authenticate, authorize('staff', 'doctor', 'admin'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('beds.patient', 'name email phone');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { roomType, floor, status, charges } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (roomType) room.roomType = roomType;
    if (floor) room.floor = floor;
    if (status) room.status = status;
    if (charges) room.charges = charges;
    
    await room.save();
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if room has occupied beds
    const hasOccupiedBeds = room.beds.some(bed => bed.status === 'occupied');
    if (hasOccupiedBeds) {
      return res.status(400).json({ message: 'Cannot delete room with occupied beds' });
    }
    
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

