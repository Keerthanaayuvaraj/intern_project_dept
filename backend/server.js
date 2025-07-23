
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const { authMiddleware } = require('./auth');
const app = express();
const PORT = 5000;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB connection
mongoose.connect('mongodb://10.5.12.1:27017/studentRepository')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    await autoHashExistingPasswords();  // ✅ Call auto hash before server starts

  })
  .catch(err => console.error('MongoDB connection error:', err));

// Enable CORS
//app.use(cors());
app.use(cors({
  origin: 'http://10.5.12.1'
}));
app.use(express.json());

// Models
const StudentAchievement = require('./model/studentAchievement');
const Student = require('./model/student');
async function autoHashExistingPasswords() {
  try {
    const students = await Student.find();

    for (const student of students) {
      if (student.password && !student.password.startsWith('$2b$')) {
        student.password = await bcrypt.hash(student.password, 10);
        await student.save();
        console.log(`✔️ Password hashed for student: ${student.email || student._id}`);
      }
    }

    console.log('✅ All plain text passwords hashed (if any).');
  } catch (error) {
    console.error('❌ Error during password hashing:', error);
  }
}

// Configure multer to handle file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload endpoint
app.post('/upload', authMiddleware('student'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, fromDate, toDate, shortDescription, category, companyName } = req.body;
    const studentId = req.user.id;
    console.log('Saving achievement for studentId:', studentId);
    const achievement = new StudentAchievement({
      title,
      description,
      fromDate,
      toDate,
      companyName, 
      shortDescription,
      category,
      studentId,
      file: {
        filename: req.file.originalname,
        data: req.file.buffer,
        contentType: req.file.mimetype
      },
      fileType: req.file.mimetype.startsWith('image') ? 'image' : 'pdf'
    });

    await achievement.save();

    // Auto-update hasInterned or isPlaced
    if (category === 'Internships') {
      await Student.findByIdAndUpdate(studentId, { hasInterned: true });
    }
    if (category === 'Placement') {
      await Student.findByIdAndUpdate(studentId, { isPlaced: true });
    }

    res.status(201).json({
      message: 'File uploaded and record created successfully',
      achievement
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Get file endpoint
app.get('/file/:id', async (req, res) => {
  try {
    const achievement = await StudentAchievement.findById(req.params.id);
    
    if (!achievement || !achievement.file.data) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.set('Content-Type', achievement.file.contentType);
    res.set('Content-Disposition', `inline; filename="${achievement.file.filename}"`);
    res.send(achievement.file.data);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Server error during download' });
  }
});

// Get achievements by student ID and category
app.get('/achievements/:studentId/:category', authMiddleware('student'), async (req, res) => {
  try {
    // Verify the requesting student matches the requested studentId
    if (req.user.id !== req.params.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const achievements = await StudentAchievement.find({
      studentId: req.params.studentId,
      category: req.params.category
    }).sort({ createdAt: -1 });

    // Don't send file data in list view to reduce payload size
    const achievementsWithoutFileData = achievements.map(ach => ({
      ...ach.toObject(),
      file: { 
        filename: ach.file.filename,
        contentType: ach.file.contentType,
        id: ach._id 
      }
    }));

    res.json(achievementsWithoutFileData);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Server error fetching data' });
  }
});

// Update achievement
app.put('/achievements/:id', authMiddleware('student'), upload.single('file'), async (req, res) => {
  try {
    const { title, description, fromDate, toDate, shortDescription, category, companyName } = req.body;
    const updateData = {
      title,
      description,
      fromDate,
      toDate,
      companyName,
      shortDescription,
      category,
      studentId: req.user.id
    };

    if (req.file) {
      updateData.file = {
        filename: req.file.originalname,
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
      updateData.fileType = req.file.mimetype.startsWith('image') ? 'image' : 'pdf';
    }

    const updatedAchievement = await StudentAchievement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedAchievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json(updatedAchievement);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Server error during update' });
  }
});

// Delete achievement
app.delete('/achievements/:id', async (req, res) => {
  try {
    const deletedAchievement = await StudentAchievement.findByIdAndDelete(req.params.id);
    
    if (!deletedAchievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

app.put('/change-password', authMiddleware('student'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const studentId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Both current and new password are required' 
      });
    }

    // Optional: Enforce minimum password length
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 8 characters long' 
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect' 
      });
    }

    // ✅ Assign plain new password (pre-save hook will hash it)
    student.password = newPassword;

    await student.save();

    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while changing password' 
    });
  }
});

// Get student profile
app.get('/api/student/profile', authMiddleware('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select('-password -__v');
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile' 
    });
  }
});

// Update CGPA
app.put('/api/student/cgpa', authMiddleware('student'), async (req, res) => {
  try {
    const { cgpa } = req.body;
    
    if (cgpa === undefined || cgpa < 0 || cgpa > 10) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide a valid CGPA (0-10)' 
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.user.id,
      { cgpa },
      { new: true, select: '-password -__v' }
    );

    res.json({
      success: true,
      student: updatedStudent,
      message: 'CGPA updated successfully'
    });
  } catch (error) {
    console.error('CGPA update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update CGPA' 
    });
  }
});

// Profile photo upload
app.post('/api/student/profile-photo', authMiddleware('student'), upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only JPEG and PNG images are allowed' });
    }

    // Validate file size (2MB max)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 2MB' });
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: req.file.filename },
      { new: true }
    ).select('-password'); // Exclude password from response

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      profilePhotoUrl: `/profile-photos/${req.file.filename}`,
      message: 'Profile photo updated successfully'
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ error: 'Failed to update profile photo' });
  }
});

// Serve profile photos
app.get('/profile-photos/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', 'profile-photos', req.params.filename));
});



// Start server
app.listen(PORT, () => console.log(`Server running on http://10.5.12.1.:${PORT}`));



app.use('/api', require('./routes/studentRoutes'));