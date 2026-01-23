const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true
  },
  roomType: {
    type: String,
    enum: ['general', 'icu', 'private'],
    required: true
  },
  floor: {
    type: Number
  },
  bedCount: {
    type: Number,
    required: true,
    default: 1
  },
  beds: [{
    bedNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available'
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedDate: {
      type: Date
    }
  }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  charges: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);

