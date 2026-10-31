import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentCheck,
  HiOutlineClock,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/quizzes/${quizId}/attempt`);
      const qData = res.data.data;
      setQuiz(qData);

      if (qData.timeLimit && qData.timeLimit > 0) {
        setTimeLeft(qData.timeLimit * 60);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot access this quiz');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Time limit reached! Submitting quiz automatically.');
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelectChoice = (questionIndex, selectedChoiceIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        questionIndex,
        selectedChoiceIndex,
      },
    }));
  };

  const handleTextAnswer = (questionIndex, textAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        questionIndex,
        textAnswer,
      },
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    const answerPayload = Object.values(answers);

    try {
      setSubmitting(true);
      const res = await api.post('/quiz-attempts', {
        quizId,
        answers: answerPayload,
      });

      toast.success('Quiz submitted successfully!');
      navigate(`/student/quiz-result/${res.data.data.attemptId}`, {
        state: { result: res.data.data },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading quiz assessment...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-12 text-red-500">Quiz not available.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="sticky top-20 z-20 bg-white/95 backdrop-blur border border-gray-200 rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 truncate max-w-sm">{quiz.title}</h1>
          <span className="text-xs text-gray-500">
            Attempt {quiz.currentAttemptNumber} of {quiz.maxAttempts} • Pass: {quiz.passingPercentage}%
          </span>
        </div>

        {timeLeft !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl font-mono text-xs font-bold border border-rose-200">
            <HiOutlineClock className="w-4 h-4" />
            <span>Time Left: {formatTimer(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      {quiz.description && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
          <p className="font-semibold text-slate-900 mb-0.5">Assessment Instructions:</p>
          <p>{quiz.description}</p>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {quiz.questions.map((q, idx) => (
          <div
            key={idx}
            className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Question {idx + 1} of {quiz.questions.length}
              </span>
              <span className="text-xs text-gray-500 font-semibold">{q.points} pt(s)</span>
            </div>

            <p className="text-sm font-semibold text-gray-900 leading-relaxed">{q.questionText}</p>

            {/* Multiple Choice / True-False choices */}
            {q.questionType !== 'identification' && (
              <div className="space-y-2 pt-1">
                {q.choices.map((choice, cIdx) => {
                  const isSelected =
                    answers[q.originalIndex]?.selectedChoiceIndex === choice.originalIndex;

                  return (
                    <label
                      key={cIdx}
                      onClick={() => handleSelectChoice(q.originalIndex, choice.originalIndex)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.originalIndex}`}
                        checked={isSelected}
                        onChange={() => {}}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>{choice.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Identification answer text input */}
            {q.questionType === 'identification' && (
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={answers[q.originalIndex]?.textAnswer || ''}
                  onChange={(e) => handleTextAnswer(q.originalIndex, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <HiOutlineShieldCheck className="w-5 h-5" />
            {submitting ? 'Evaluating Assessment...' : 'Submit Answers & Calculate Grade'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizAttempt;

