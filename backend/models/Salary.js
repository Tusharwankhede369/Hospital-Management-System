const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  bonus: {
    type: Number,
    default: 0
  },
  deduction: {
    type: Number,
    default: 0
  },
  overtime: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidDate: {
    type: Date
  },
  paymentMode: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque']
  },
  notes: {
    type: String
  },
  changeLog: [
    {
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      reason: {
        type: String
      },
      before: {
        baseSalary: Number,
        bonus: Number,
        deduction: Number,
        overtime: Number,
        totalAmount: Number,
        notes: String
      },
      after: {
        baseSalary: Number,
        bonus: Number,
        deduction: Number,
        overtime: Number,
        totalAmount: Number,
        notes: String
      }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Salary', salarySchema);

