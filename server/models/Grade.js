const mongoose = require('mongoose');

const quizGradeSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz reference is required'],
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson reference is required'],
    },
    highestScore: {
      type: Number,
      required: [true, 'Highest score is required'],
    },
    totalPoints: {
      type: Number,
      required: [true, 'Total points is required'],
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: [true, 'Passed flag is required'],
    },
  },
  { _id: false }
);

const additionalGradeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Grade title is required'],
      trim: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
    },
    totalPoints: {
      type: Number,
      required: [true, 'Total points is required'],
    },
    weight: {
      type: Number,
      default: 1,
      min: [0, 'Weight cannot be negative'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    courseOffering: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: [true, 'Course offering is required'],
    },
    quizGrades: {
      type: [quizGradeSchema],
      default: [],
    },
    additionalGrades: {
      type: [additionalGradeSchema],
      default: [],
    },
    overallGrade: {
      type: Number,
    },
    letterGrade: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

gradeSchema.index({ student: 1, courseOffering: 1 }, { unique: true });

const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;
