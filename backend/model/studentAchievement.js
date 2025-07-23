const mongoose = require('mongoose');

const studentAchievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date
  },
  companyName: {
    type: String,
    required: function () {
      return this.category === 'Internship' || this.category === 'Placement';
    }
  },
  shortDescription: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Internships',
      'Placement',
      'Higher Education',
      'Competitive Exams',
      'Course',
      'Achievements (Co-Curriculum)',
      'Participation',
      'Extra-Curricular Activities'
    ]
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  file: {
    filename: String,
    data: Buffer,
    contentType: String
  },
  fileType: {
    type: String,
    enum: ['image', 'pdf']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudentAchievement', studentAchievementSchema);