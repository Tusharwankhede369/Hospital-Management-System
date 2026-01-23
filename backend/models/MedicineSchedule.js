const mongoose = require('mongoose');

const medicineScheduleSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientRecord',
    required: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: String,
  dosage: String,
  timing: {
    morning: {
      time: String,
      beforeFood: Boolean,
      given: {
        type: Boolean,
        default: false
      },
      givenAt: Date,
      givenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    afternoon: {
      time: String,
      beforeFood: Boolean,
      given: {
        type: Boolean,
        default: false
      },
      givenAt: Date,
      givenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    night: {
      time: String,
      beforeFood: Boolean,
      given: {
        type: Boolean,
        default: false
      },
      givenAt: Date,
      givenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  duration: Number, // in days
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicineSchedule', medicineScheduleSchema);

