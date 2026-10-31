const mongoose = require('mongoose');

const courseOfferingSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester is required'],
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty is required'],
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    yearLevel: {
      type: Number,
      min: [1, 'Year level must be at least 1'],
    },
    degreeProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeProgram',
    },
    maxStudents: {
      type: Number,
      min: [1, 'Max students must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
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

courseOfferingSchema.virtual('lessonCount', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'courseOffering',
  count: true,
});

courseOfferingSchema.virtual('enrollmentCount', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'courseOffering',
  count: true,
});

courseOfferingSchema.index(
  { course: 1, academicYear: 1, semester: 1, section: 1, faculty: 1 },
  { unique: true }
);

const CourseOffering = mongoose.model('CourseOffering', courseOfferingSchema);

module.exports = CourseOffering;
