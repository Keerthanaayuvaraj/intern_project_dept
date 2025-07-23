const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emp_no: { type: String, required: true, unique: true },   // Add this line
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    role: { type: String, default: 'admin' },
    otp: { type: String }, // NEW
    otpExpiry: { type: Date }, // NEW
});

// Hash password before save
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('Admin', adminSchema);
