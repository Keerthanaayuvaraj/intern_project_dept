 const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  startOfStudy: { type: Date, required: false },
  endOfStudy: { type: Date, required: false },

  yearOfStudy: { type: String },  // Optional: keep this for display if needed

  batch: { type: String, required: true },
  cgpa: {type: Number, min: 0, max: 10, default: null },

  hasInterned: { type: Boolean, default: false },
  isPlaced: { type: Boolean, default: false },
  internships: [{ type: String }],
  placements: [{ type: String }],
  courses: [{ type: String }],
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentAchievement' }],
  rollNumber: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  otp: { type: String }, // NEW
  otpExpiry: { type: Date } // NEW
});

// Password hashing using pre-save hook (safe version)
studentSchema.pre('save', async function (next) {
  console.log(`Hashing password for ${this.email}`);
  try {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (err) {
    console.error('Hashing failed:', err);
    next(err);
  }
});

module.exports = mongoose.model('Student', studentSchema);


