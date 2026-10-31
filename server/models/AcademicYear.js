const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema(
  {
    yearStart: {
      type: Number,
      required: [true, 'Start year is required'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v > 2000;
        },
        message: 'Start year must be a valid year after 2000',
      },
    },
    yearEnd: {
      type: Number,
      required: [true, 'End year is required'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v > 2000;
        },
        message: 'End year must be a valid year after 2000',
      },
    },
    isCurrent: {
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

academicYearSchema.virtual('displayName').get(function () {
  return `${this.yearStart}-${this.yearEnd}`;
});

academicYearSchema.pre('save', function () {
  if (this.yearEnd !== this.yearStart + 1) {
    this.yearEnd = this.yearStart + 1;
  }
});

academicYearSchema.index({ yearStart: 1, yearEnd: 1 }, { unique: true });

const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);

module.exports = AcademicYear;
