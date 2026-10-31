import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentCheck,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

const QuizManagement = () => {
  const { id, lessonId } = useParams(); // id = courseOfferingId
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passingPercentage: 75,
    timeLimit: 15,
    maxAttempts: 3,
    randomizeQuestions: false,
    randomizeChoices: false,
    questions: [],
  });

  useEffect(() => {
    fetchQuizData();
  }, [lessonId]);

  const fetchQuizData = async () => {
    try {
      const lessonRes = await api.get(`/lessons/${lessonId}`);
      setLesson(lessonRes.data.data);

      if (lessonRes.data.data.quiz) {
        const qId = lessonRes.data.data.quiz._id || lessonRes.data.data.quiz;
        const quizRes = await api.get(`/quizzes/${qId}/preview`);
        const qData = quizRes.data.data;
        setQuiz(qData);
        setFormData({
          title: qData.title,
          description: qData.description || '',
          passingPercentage: qData.passingPercentage,
          timeLimit: qData.timeLimit || 0,
          maxAttempts: qData.maxAttempts || 3,
          randomizeQuestions: qData.randomizeQuestions || false,
          randomizeChoices: qData.randomizeChoices || false,
          questions: qData.questions || [],
        });
      } else {
        // Initialize default empty question
        setFormData((prev) => ({
          ...prev,
          title: `Quiz: ${lessonRes.data.data.title}`,
          description: `Pass this quiz with at least 75% to unlock the subsequent lesson.`,
          questions: [
            {
              questionText: '',
              questionType: 'multiple_choice',
              points: 1,
              explanation: '',
              choices: [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
              ],
              correctAnswer: '',
            },
          ],
        }));
      }
    } catch (error) {
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type = 'multiple_choice') => {
    const newQ = {
      questionText: '',
      questionType: type,
      points: 1,
      explanation: '',
      choices:
        type === 'true_false'
          ? [
              { text: 'True', isCorrect: true },
              { text: 'False', isCorrect: false },
            ]
          : type === 'multiple_choice'
          ? [
              { text: '', isCorrect: true },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
            ]
          : [],
      correctAnswer: '',
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  const removeQuestion = (qIndex) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex),
    }));
  };

  const updateQuestion = (qIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[qIndex] = { ...updated[qIndex], [field]: value };

      // Reset choices if type changed
      if (field === 'questionType') {
        if (value === 'true_false') {
          updated[qIndex].choices = [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false },
          ];
          updated[qIndex].correctAnswer = '';
        } else if (value === 'multiple_choice') {
          updated[qIndex].choices = [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ];
          updated[qIndex].correctAnswer = '';
        } else if (value === 'identification') {
          updated[qIndex].choices = [];
          updated[qIndex].correctAnswer = '';
        }
      }

      return { ...prev, questions: updated };
    });
  };

  const updateChoice = (qIndex, cIndex, text) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const choices = [...updated[qIndex].choices];
      choices[cIndex] = { ...choices[cIndex], text };
      updated[qIndex].choices = choices;
      return { ...prev, questions: updated };
    });
  };

  const setCorrectChoice = (qIndex, cIndex) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const choices = updated[qIndex].choices.map((c, idx) => ({
        ...c,
        isCorrect: idx === cIndex,
      }));
      updated[qIndex].choices = choices;
      return { ...prev, questions: updated };
    });
  };

  const totalPoints = formData.questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.questions.length === 0) {
      toast.error('Quiz must have at least one question');
      return;
    }

    // Validation
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      if (q.questionType === 'identification' && !q.correctAnswer.trim()) {
        toast.error(`Question ${i + 1} requires a correct answer string`);
        return;
      }
      if (q.questionType === 'multiple_choice') {
        const hasCorrect = q.choices.some((c) => c.isCorrect);
        if (!hasCorrect) {
          toast.error(`Question ${i + 1} must have a marked correct choice`);
          return;
        }
      }
    }

    try {
      if (quiz) {
        await api.put(`/quizzes/${quiz._id}`, {
          ...formData,
          lesson: lessonId,
        });
        toast.success('Quiz updated successfully');
      } else {
        await api.post('/quizzes', {
          ...formData,
          lesson: lessonId,
        });
        toast.success('Quiz created successfully');
      }
      navigate(`/faculty/course-offerings/${id}/lessons`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save quiz');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading quiz builder...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to={`/faculty/course-offerings/${id}/lessons`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Lessons
        </Link>
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-semibold"
        >
          <HiOutlineEye className="w-4 h-4" />
          {previewMode ? 'Exit Preview' : 'Preview Quiz'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <HiOutlineDocumentCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {quiz ? 'Edit Quiz Assessment' : 'Create Quiz Assessment'}
            </h1>
            <p className="text-xs text-gray-500">
              Attached to: <span className="font-semibold text-gray-700">{lesson?.title}</span>
            </p>
          </div>
        </div>

        {previewMode ? (
          /* PREVIEW MODE */
          <div className="mt-6 space-y-6 border-t border-gray-100 pt-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h2 className="text-lg font-bold text-gray-900">{formData.title}</h2>
              <p className="text-xs text-gray-600 mt-1">{formData.description}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 font-medium">
                <span>Passing: {formData.passingPercentage}%</span>
                <span>Total Points: {totalPoints}</span>
                <span>Time Limit: {formData.timeLimit ? `${formData.timeLimit} mins` : 'None'}</span>
                <span>Max Attempts: {formData.maxAttempts}</span>
              </div>
            </div>

            <div className="space-y-4">
              {formData.questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-900">
                      {idx + 1}. {q.questionText}
                    </p>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {q.points} pt(s)
                    </span>
                  </div>

                  {q.questionType === 'identification' ? (
                    <div className="mt-3">
                      <input
                        type="text"
                        disabled
                        placeholder="Student types answer here..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50"
                      />
                      <p className="text-xs text-emerald-600 mt-1 font-semibold">
                        Correct Answer: {q.correctAnswer}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {q.choices.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            c.isCorrect
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          <input type="radio" disabled checked={c.isCorrect} />
                          <span>{c.text || `Option ${cIdx + 1}`}</span>
                          {c.isCorrect && (
                            <span className="ml-auto text-[10px] uppercase font-bold text-emerald-700">
                              (Correct Answer)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-xs text-gray-500 mt-2 bg-slate-50 p-2 rounded">
                      <span className="font-semibold">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FORM EDITOR */
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Quiz Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Quiz Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Instructions / Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Passing Score (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.passingPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, passingPercentage: Number(e.target.value) })
                  }
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <span className="text-[11px] text-gray-500">Students must score ≥ this % to unlock next lesson</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Allowed Attempts *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxAttempts}
                  onChange={(e) =>
                    setFormData({ ...formData, maxAttempts: Number(e.target.value) })
                  }
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Time Limit (Minutes - 0 for none)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-6 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.randomizeQuestions}
                    onChange={(e) =>
                      setFormData({ ...formData, randomizeQuestions: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-gray-700">Randomize Questions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.randomizeChoices}
                    onChange={(e) =>
                      setFormData({ ...formData, randomizeChoices: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-gray-700">Randomize Choices</span>
                </label>
              </div>
            </div>

            {/* Questions Header */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Questions ({formData.questions.length})
                </h2>
                <p className="text-xs text-gray-500">Total Points: {totalPoints}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion('multiple_choice')}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200"
                >
                  + Multiple Choice
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('true_false')}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200"
                >
                  + True / False
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('identification')}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200"
                >
                  + Identification
                </button>
              </div>
            </div>

            {/* Question Items */}
            <div className="space-y-6">
              {formData.questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Question #{qIndex + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <select
                        value={q.questionType}
                        onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                        className="text-xs px-2.5 py-1 border border-gray-300 rounded-md bg-white font-medium"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True or False</option>
                        <option value="identification">Identification / Short Answer</option>
                      </select>

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Pts:</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={q.points}
                          onChange={(e) => updateQuestion(qIndex, 'points', Number(e.target.value))}
                          className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-xs font-semibold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="p-1 text-gray-400 hover:text-rose-600"
                        title="Delete Question"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                      placeholder="Enter question prompt..."
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                    />
                  </div>

                  {/* Multiple Choice Choices */}
                  {q.questionType === 'multiple_choice' && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Choices (Select the radio of the correct answer):
                      </p>
                      {q.choices.map((choice, cIndex) => (
                        <div key={cIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={choice.isCorrect}
                            onChange={() => setCorrectChoice(qIndex, cIndex)}
                            className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={choice.text}
                            onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                            placeholder={`Choice ${cIndex + 1}`}
                            required
                            className={`flex-1 px-3 py-1.5 border rounded-lg text-xs ${
                              choice.isCorrect
                                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900 font-semibold'
                                : 'border-gray-200'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True / False Choices */}
                  {q.questionType === 'true_false' && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Correct Answer:
                      </p>
                      <div className="flex gap-4">
                        {q.choices.map((choice, cIndex) => (
                          <label
                            key={cIndex}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer ${
                              choice.isCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-tf-${qIndex}`}
                              checked={choice.isCorrect}
                              onChange={() => setCorrectChoice(qIndex, cIndex)}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{choice.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Identification */}
                  {q.questionType === 'identification' && (
                    <div className="pt-1">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Exact Correct Answer (case-insensitive evaluation)
                      </label>
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                        placeholder="e.g. Polymorphism"
                        required
                        className="block w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-mono font-semibold text-emerald-900 bg-emerald-50/50"
                      />
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                      placeholder="Optional explanation shown to student after submitting attempt..."
                      className="block w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                to={`/faculty/course-offerings/${id}/lessons`}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                {quiz ? 'Save Quiz Changes' : 'Publish Quiz Assessment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuizManagement;

