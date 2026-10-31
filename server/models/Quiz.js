const mongoose = require('mongoose');

const choiceSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Choice text is required'],
    },
    isCorrect: {
      type: Boolean,
      required: [true, 'isCorrect flag is required'],
      default: false,
    },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    questionType: {
      type: String,
      required: [true, 'Question type is required'],
      enum: {
        values: ['multiple_choice', 'true_false', 'identification'],
        message: 'Question type must be multiple_choice, true_false, or identification',
      },
    },
    choices: {
      type: [choiceSchema],
      default: [],
    },
    correctAnswer: {
      type: String,
    },
    points: {
      type: Number,
      required: [true, 'Points are required'],
      default: 1,
      min: [0, 'Points cannot be negative'],
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson is required'],
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: 'A quiz must have at least one question',
      },
    },
    passingPercentage: {
      type: Number,
      required: [true, 'Passing percentage is required'],
      default: 75,
      min: [0, 'Passing percentage cannot be less than 0'],
      max: [100, 'Passing percentage cannot exceed 100'],
    },
    totalPoints: {
      type: Number,
      required: [true, 'Total points is required'],
      min: [0, 'Total points cannot be negative'],
    },
    timeLimit: {
      type: Number,
      min: [1, 'Time limit must be at least 1 minute'],
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: [1, 'Max attempts must be at least 1'],
    },
    availableFrom: {
      type: Date,
    },
    availableUntil: {
      type: Date,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    randomizeChoices: {
      type: Boolean,
      default: false,
    },
    isPublished: {
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

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
