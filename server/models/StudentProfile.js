const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
    },
    degreeProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeProgram',
      required: [true, 'Degree program is required'],
    },
    enrollmentYear: {
      type: Number,
      required: [true, 'Enrollment year is required'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v > 2000;
        },
        message: 'Enrollment year must be a valid year after 2000',
      },
    },
    currentYearLevel: {
      type: Number,
      default: 1,
      min: [1, 'Year level must be at least 1'],
    },
    section: {
      type: String,
      trim: true,
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

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
