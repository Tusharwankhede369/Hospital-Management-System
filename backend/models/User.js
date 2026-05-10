const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'staff', 'hr', 'admin', 'owner', 'admin_manager'],
    required: true
  },
  adminPermissions: {
    canManageUsers: { type: Boolean, default: true },
    canManageAppointments: { type: Boolean, default: true },
    canManagePayments: { type: Boolean, default: true },
    canManageRooms: { type: Boolean, default: true },
    canManageMedicines: { type: Boolean, default: true },
    canManageSalaries: { type: Boolean, default: true }
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dateOfBirth: {
    type: Date
  },
  bloodGroup: {
    type: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  // Doctor specific fields
  qualification: {
    type: String
  },
  department: {
    type: String
  },
  experience: {
    type: Number
  },
  consultationFees: {
    type: Number
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  workingHours: {
    start: String,
    end: String
  },
  breakTime: {
    start: String,
    end: String
  },
  // Staff specific fields
  staffType: {
    type: String,
    enum: ['receptionist', 'nurse', 'lab_staff', 'ward_staff']
  },
  assignedDepartment: {
    type: String
  },
  // HR specific fields
  salary: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

