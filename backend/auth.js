const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Student = require('./model/student');
const Admin = require('./model/admin');

const JWT_SECRET = 'your_jwt_secret'; // Replace with env var in production

// Generate JWT
function generateToken(user, role) {
  return jwt.sign({ id: user._id, role }, JWT_SECRET, { expiresIn: '1d' });
}

// Middleware to verify JWT and role
function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Register Student
async function registerStudent(req, res) {
  try {
    const { name, email, password, yearOfStudy, batch, cgpa, rollNumber } = req.body;
    if (!rollNumber) return res.status(400).json({ error: 'Roll number is required' });
    const existing = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (existing) return res.status(400).json({ error: 'Email or roll number already registered' });
    const student = new Student({ name, email, password, yearOfStudy, batch, cgpa, rollNumber });
    await student.save();
    const token = generateToken(student, 'student');
    res.status(201).json({ token, student });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
}


async function registerAdmin(req, res) {
  try {
    const { name, email, emp_no, password } = req.body;

    // Check for existing email or emp_no
    const existing = await Admin.findOne({ $or: [{ email }, { emp_no }] });
    if (existing) return res.status(400).json({ error: 'Email or Employee Number already registered' });

    // Create new admin with emp_no
    const admin = new Admin({ name, emp_no, email, password });
    await admin.save();

    const token = generateToken(admin, 'admin');
    res.status(201).json({ token, admin });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Login (Student/Admin)
// Login (Student/Admin) - without bcrypt
async function login(req, res, role) {
  try {
    const { email, password } = req.body;
    const Model = role === 'admin' ? Admin : Student;
    const user = await Model.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user, role);
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}


module.exports = {
  registerStudent,
  registerAdmin,
  login,
  authMiddleware
}; 