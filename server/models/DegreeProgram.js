const mongoose = require('mongoose');

const degreeProgramSchema = new mongoose.Schema(
  {
    programName: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
    },
    programCode: {
      type: String,
      required: [true, 'Program code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    availableYearLevels: {
      type: [Number],
      default: [1, 2, 3, 4],
      validate: {
        validator: function (arr) {
          return arr.length > 0 && arr.every((v) => Number.isInteger(v) && v > 0);
        },
        message: 'Available year levels must be an array of positive integers',
      },
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

const DegreeProgram = mongoose.model('DegreeProgram', degreeProgramSchema);

module.exports = DegreeProgram;
