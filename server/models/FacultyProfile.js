const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    facultyId: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    specialization: {
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

const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);

module.exports = FacultyProfile;
