import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineBookOpen,
} from 'react-icons/hi2';

const QuizResult = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const result = location.state?.result;

  if (!result) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <p className="text-sm text-gray-600 mb-4">Quiz result details not found in session.</p>
        <Link
          to="/student/courses"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to My Courses
        </Link>
      </div>
    );
  }

  const {
    score,
    totalPoints,
    percentage,
    passed,
    passingPercentage,
    attemptNumber,
    maxAttempts,
    nextLessonUnlocked,
    gradedAnswers,
  } = result;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Result Card */}
      <div
        className={`rounded-3xl p-8 text-center shadow-lg border ${
          passed
            ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200'
            : 'bg-gradient-to-b from-rose-50 to-white border-rose-200'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
        >
          {passed ? (
            <HiOutlineCheckCircle className="w-12 h-12" />
          ) : (
            <HiOutlineXCircle className="w-12 h-12" />
          )}
        </div>

        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 ${
            passed
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {passed ? 'Assessment Passed' : 'Assessment Failed'}
        </span>

        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
          {percentage}% Score
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          You earned <strong className="text-gray-900">{score}</strong> out of{' '}
          <strong className="text-gray-900">{totalPoints}</strong> points.
        </p>

        <p className="text-xs text-gray-500 mt-2">
          Passing requirement: {passingPercentage}% • Attempt {attemptNumber} of {maxAttempts}
        </p>

        {/* Milestone feedback */}
        {passed ? (
          <div className="mt-6 p-4 bg-emerald-100/60 border border-emerald-300 rounded-2xl max-w-md mx-auto text-xs text-emerald-900 font-semibold">
            🎉 Congratulations! You satisfied the sequential progression requirement.
            {nextLessonUnlocked && (
              <p className="mt-1 font-bold">
                Module {nextLessonUnlocked.order}: "{nextLessonUnlocked.title}" has been officially unlocked!
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 p-4 bg-rose-100/60 border border-rose-300 rounded-2xl max-w-md mx-auto text-xs text-rose-900 font-semibold">
            You did not achieve the required {passingPercentage}% score. The subsequent lesson remains locked.
            {attemptNumber < maxAttempts ? (
              <p className="mt-1">
                You have {maxAttempts - attemptNumber} attempt(s) remaining. Review the materials and retake the quiz.
              </p>
            ) : (
              <p className="mt-1">
                You have reached the maximum allowed attempts. Please consult your instructor for assistance.
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/student/courses"
            className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <HiOutlineBookOpen className="w-4 h-4" />
            My Courses
          </Link>

          {!passed && attemptNumber < maxAttempts && (
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
              Retake Assessment
            </button>
          )}

          {passed && (
            <Link
              to="/student/courses"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              Proceed with Curriculum
              <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Answer Review Section */}
      {gradedAnswers && gradedAnswers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">Evaluation Review</h2>
          <div className="space-y-4">
            {gradedAnswers.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  item.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-rose-200 bg-rose-50/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-gray-500">Question {idx + 1}</span>
                  <span
                    className={item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}
                  >
                    {item.pointsEarned} / {item.maxPoints} pt(s) •{' '}
                    {item.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.questionText}</p>

                {item.textAnswer && (
                  <p className="text-xs text-gray-600 mt-2 font-mono">
                    Your submitted answer: <strong>{item.textAnswer}</strong>
                  </p>
                )}

                {item.explanation && (
                  <p className="text-xs text-gray-600 mt-2 bg-white/70 p-2.5 rounded-lg border border-gray-100">
                    <strong className="text-gray-900">Explanation:</strong> {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResult;

