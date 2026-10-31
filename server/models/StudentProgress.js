const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema(
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
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['locked', 'available', 'in_progress', 'completed'],
        message: 'Status must be locked, available, in_progress, or completed',
      },
      default: 'locked',
    },
    completedAt: {
      type: Date,
    },
    highestQuizScore: {
      type: Number,
    },
    quizPassed: {
      type: Boolean,
      default: false,
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

studentProgressSchema.index(
  { student: 1, courseOffering: 1, lessonId: 1 },
  { unique: true }
);

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

module.exports = StudentProgress;
