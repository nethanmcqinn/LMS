import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUserCircle,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineXMark,
} from 'react-icons/hi2';

const StudentDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [resetModal, setResetModal] = useState({
    show: false,
    courseOfferingId: '',
    lessonId: '',
    lessonTitle: '',
    reason: '',
  });

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const fetchStudentDetails = async () => {
    try {
      const res = await api.get(`/faculty/students/${id}`);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load student academic record');
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = (courseOfferingId, lessonId, lessonTitle) => {
    setResetModal({
      show: true,
      courseOfferingId,
      lessonId,
      lessonTitle,
      reason: 'Academic remediation requested by faculty',
    });
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quiz-attempts/reset', {
        studentId: id,
        courseOfferingId: resetModal.courseOfferingId,
        lessonId: resetModal.lessonId,
        reason: resetModal.reason,
      });
      toast.success(`Progress reset for ${resetModal.lessonTitle}. Subsequent lessons locked.`);
      setResetModal({ show: false, courseOfferingId: '', lessonId: '', lessonTitle: '', reason: '' });
      fetchStudentDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset progress');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading student details...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-500">Student not found.</div>;
  }

  const { student, profile, enrolledCourses } = data;

  return (
    <div className="space-y-6">
      <Link
        to="/faculty/students"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Student Directory
      </Link>

      {/* Student Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {student.firstName[0]}
              {student.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                  ID: {profile?.studentId}
                </span>
                <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded-full">
                  Year {profile?.currentYearLevel}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.middleName} {student.lastName}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-semibold text-gray-900">Degree Program:</span>{' '}
              {profile?.degreeProgram?.programName} ({profile?.degreeProgram?.programCode})
            </p>
            <p>
              <span className="font-semibold text-gray-900">Enrollment Year:</span>{' '}
              {profile?.enrollmentYear}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Assigned Section:</span>{' '}
              {profile?.section || 'Section A'}
            </p>
          </div>
        </div>
      </div>

      {/* Course Enrollment Breakdown */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Enrolled Courses & Academic Progression</h2>

        {enrolledCourses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
            This student is not currently enrolled in any of your course offerings.
          </div>
        ) : (
          enrolledCourses.map((item) => (
            <div
              key={item.enrollment._id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {item.courseOffering.course?.courseCode} - {item.courseOffering.section}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    {item.courseOffering.course?.courseTitle}
                  </h3>
                </div>
                <span className="text-xs text-gray-500">
                  {item.courseOffering.semester?.name} • A.Y.{' '}
                  {item.courseOffering.academicYear?.yearStart}-
                  {item.courseOffering.academicYear?.yearEnd}
                </span>
              </div>

              {/* Lesson Progression for this Course */}
              <div className="p-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Curriculum Module Progression
                </h4>

                <div className="space-y-3">
                  {item.progress.length === 0 ? (
                    <p className="text-xs text-gray-400">No curriculum lessons loaded for this class.</p>
                  ) : (
                    item.progress.map((prog) => (
                      <div
                        key={prog._id}
                        className="p-3.5 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`p-2 rounded-lg text-xs font-bold ${
                              prog.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : prog.status === 'available' || prog.status === 'in_progress'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {prog.status === 'completed' ? (
                              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : prog.status === 'locked' ? (
                              <HiOutlineLockClosed className="w-5 h-5 text-gray-400" />
                            ) : (
                              <HiOutlineBookOpen className="w-5 h-5 text-indigo-600" />
                            )}
                          </span>

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {prog.lessonId?.title || 'Lesson'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span className="capitalize font-medium">Status: {prog.status}</span>
                              {prog.highestQuizScore !== null && prog.highestQuizScore !== undefined && (
                                <span className="font-semibold text-gray-700">
                                  Highest Quiz Score: {prog.highestQuizScore}%
                                </span>
                              )}
                              {prog.quizPassed && (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                                  Passed ✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reset button if student already made progress */}
                        {prog.status !== 'locked' && (
                          <button
                            onClick={() =>
                              openResetModal(
                                item.courseOffering._id,
                                prog.lessonId?._id,
                                prog.lessonId?.title
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                            title="Reset student progress for this lesson and lock subsequent modules"
                          >
                            <HiOutlineArrowPath className="w-3.5 h-3.5" />
                            Reset Progress
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Quiz Attempts History for this Course */}
                {item.attempts.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Quiz Attempts History
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 text-xs">
                        <thead>
                          <tr className="text-gray-400 text-left">
                            <th className="py-2">Quiz Title</th>
                            <th className="py-2">Attempt</th>
                            <th className="py-2">Score</th>
                            <th className="py-2">Percentage</th>
                            <th className="py-2">Outcome</th>
                            <th className="py-2">Date Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {item.attempts.map((att) => (
                            <tr key={att._id} className="text-gray-700">
                              <td className="py-2 font-medium text-gray-900">{att.quiz?.title}</td>
                              <td className="py-2">Attempt #{att.attemptNumber}</td>
                              <td className="py-2 font-semibold">
                                {att.score} / {att.totalPoints}
                              </td>
                              <td className="py-2">{att.percentage}%</td>
                              <td className="py-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    att.passed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {att.passed ? 'PASSED' : 'FAILED'}
                                </span>
                              </td>
                              <td className="py-2 text-gray-400">
                                {new Date(att.submittedAt || att.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Progress Reset Confirmation Modal */}
      {resetModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setResetModal({ ...resetModal, show: false })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reset Lesson Progress</h2>
            <p className="text-xs text-gray-600 mb-4">
              Resetting progress for <span className="font-semibold">{resetModal.lessonTitle}</span>{' '}
              will revoke the passed quiz status, clear student quiz attempts on this module, and{' '}
              <span className="font-bold text-rose-600">
                relock all subsequent lessons in this course
              </span>
              . An audit record will be logged.
            </p>

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Reason for Reset *</label>
                <textarea
                  rows="3"
                  value={resetModal.reason}
                  onChange={(e) => setResetModal({ ...resetModal, reason: e.target.value })}
                  required
                  placeholder="Explain remediation reason..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModal({ ...resetModal, show: false })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Confirm & Reset Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;

