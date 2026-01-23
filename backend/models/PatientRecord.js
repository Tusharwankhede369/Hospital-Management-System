const mongoose = require('mongoose');

const patientRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  diagnosis: {
    type: String
  },
  symptoms: [{
    type: String
  }],
  treatmentPlan: {
    type: String
  },
  prescriptions: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine'
    },
    medicineName: String,
    dosage: String,
    timing: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'before_food', 'after_food']
    },
    duration: Number, // in days
    frequency: String
  }],
  followUpDate: {
    type: Date
  },
  notes: {
    type: String
  },
  isAdmitted: {
    type: Boolean,
    default: false
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  bedNumber: {
    type: Number
  },
  admissionDate: {
    type: Date
  },
  dischargeDate: {
    type: Date
  },
  dailyNotes: [{
    date: Date,
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PatientRecord', patientRecordSchema);

