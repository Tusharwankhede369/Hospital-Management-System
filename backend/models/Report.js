const mongoose = require('mongoose');

const analysisItemSchema = new mongoose.Schema(
  {
    parameter: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String
    },
    status: {
      type: String,
      enum: ['low', 'normal', 'high'],
      required: true
    }
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    testType: {
      type: String,
      required: true
    },
    testName: {
      type: String,
      required: true
    },
    reportFile: {
      type: String // URL or path to uploaded file
    },
    testResults: {
      type: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    },
    notes: {
      type: String
    },
    ocrText: {
      type: String
    },
    analysis: [analysisItemSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Report', reportSchema);

