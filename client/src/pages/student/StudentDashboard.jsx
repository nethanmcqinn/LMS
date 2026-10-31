import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineDocumentCheck,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineIdentification,
} from 'react-icons/hi2';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/students/dashboard');
      setDashboardData(res.data.data);
    } catch (error) {
      toast.error('Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading student portal...</div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-12 text-red-500">Failed to load academic profile.</div>;
  }

  const {
    studentId,
    fullName,
    degreeProgram,
    currentYearLevel,
    section,
    currentAcademicYear,
    currentSemester,
    enrolledCourses,
    overallAcademicProgress,
    recentQuizResults,
    upcomingAssessments,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Student Academic Identity Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
              <HiOutlineIdentification className="w-4 h-4" />
              <span>Official Student ID:</span>
              <span className="font-mono font-bold tracking-wider">{studentId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {fullName}!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm">
              {degreeProgram?.programName} ({degreeProgram?.programCode}) • Year {currentYearLevel} • {section || 'Section A'}
            </p>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-8 text-xs text-emerald-100">
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-200 block">
                Current Term
              </span>
              <span className="text-sm font-bold text-white">
                {currentSemester}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-white/80 font-mono">A.Y. {currentAcademicYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Enrolled Classes</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{enrolledCourses.length}</p>
          <span className="text-xs text-gray-400">Current Semester</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Overall Completion</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {overallAcademicProgress.percentage}%
          </p>
          <span className="text-xs text-gray-400">
            {overallAcademicProgress.completedLessons} of {overallAcademicProgress.totalLessons} modules
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Passed Lessons</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {overallAcademicProgress.completedLessons}
          </p>
          <span className="text-xs text-emerald-600 font-medium">Requirements satisfied</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Upcoming Quizzes</span>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {upcomingAssessments.length}
          </p>
          <span className="text-xs text-gray-400">Available to take</span>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Enrolled Courses</h2>
          <Link
            to="/student/courses"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
          >
            View All Courses
            <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrolledCourses.length === 0 ? (
            <div className="col-span-3 text-center py-10 bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
              You are not currently enrolled in any courses. Contact your faculty to be enrolled in your class section.
            </div>
          ) : (
            enrolledCourses.map((item) => (
              <div
                key={item.offering._id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                      {item.offering.course?.courseCode}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{item.offering.section}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug">
                    {item.offering.course?.courseTitle}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Instructor: {item.offering.faculty?.firstName} {item.offering.faculty?.lastName}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Course Progress</span>
                      <span className="text-emerald-700 font-bold">{item.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {item.completedLessons} of {item.totalLessons} lessons completed
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100">
                  <Link
                    to={`/student/courses/${item.offering._id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <HiOutlineBookOpen className="w-4 h-4" />
                    Enter Course Curriculum
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2-column: Upcoming Assessments & Recent Quiz Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assessments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineDocumentCheck className="w-5 h-5 text-emerald-600" />
            Assessments Required for Progression
          </h2>

          <div className="space-y-3">
            {upcomingAssessments.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                All currently available assessments completed! Check your course page as new lessons are published.
              </p>
            ) : (
              upcomingAssessments.map((quiz) => (
                <div
                  key={quiz.quizId}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                      {quiz.course?.courseCode}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{quiz.title}</h3>
                    <p className="text-xs text-gray-500">
                      Module: {quiz.lessonTitle} • Passing threshold: {quiz.passingPercentage}%
                    </p>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      Attempts used: {quiz.attemptsUsed} / {quiz.maxAttempts}
                    </span>
                  </div>

                  <Link
                    to={`/student/quiz/${quiz.quizId}`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap"
                  >
                    Take Quiz
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Quiz Results */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineCheckCircle className="w-5 h-5 text-indigo-600" />
            Recent Quiz Submissions
          </h2>

          <div className="space-y-3">
            {recentQuizResults.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No quiz submissions recorded yet. Open a lesson and take its assessment.
              </p>
            ) : (
              recentQuizResults.map((attempt) => (
                <div
                  key={attempt._id}
                  className="p-3.5 bg-white rounded-xl border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 font-mono">
                      {attempt.courseOffering?.course?.courseCode}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {attempt.quiz?.title || 'Quiz Assessment'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Attempt #{attempt.attemptNumber} • Submitted on{' '}
                      {new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        attempt.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </span>
                    <span className="block text-xs font-bold text-gray-700 mt-1">
                      {attempt.score} / {attempt.totalPoints} ({attempt.percentage}%)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

