import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap,
  HiOutlineUserPlus,
  HiOutlineBookOpen,
  HiOutlineChartBarSquare,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

const CourseOfferingDetail = () => {
  const { id } = useParams();
  const [offering, setOffering] = useState(null);
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    fetchOfferingData();
  }, [id]);

  const fetchOfferingData = async () => {
    try {
      const [offeringRes, studentsRes, allStudentsRes] = await Promise.all([
        api.get(`/course-offerings/${id}`),
        api.get(`/course-offerings/${id}/students`),
        api.get('/faculty/students'),
      ]);

      setOffering(offeringRes.data.data);
      setStudents(studentsRes.data.data || []);
      setAvailableStudents(allStudentsRes.data.data || []);

      if (allStudentsRes.data.data?.length > 0) {
        setSelectedStudentId(allStudentsRes.data.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      await api.post('/enrollments', {
        student: selectedStudentId,
        courseOffering: id,
      });
      toast.success('Student enrolled successfully');
      setShowEnrollModal(false);
      fetchOfferingData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    }
  };

  const handleDropStudent = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to drop this student from the class?')) return;

    try {
      await api.put(`/enrollments/${enrollmentId}/drop`);
      toast.success('Student dropped from course');
      fetchOfferingData();
    } catch (error) {
      toast.error('Failed to drop student');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading class details...</div>;
  }

  if (!offering) {
    return <div className="text-center py-12 text-red-500">Class offering not found.</div>;
  }

  // Filter out students already actively enrolled for the enrollment dropdown
  const unenrolledCandidates = availableStudents.filter(
    (cand) => !students.some((s) => s.student._id === cand._id && s.enrollmentStatus === 'active')
  );

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                {offering.course?.courseCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {offering.section}
              </span>
              <span className="text-xs font-medium text-gray-500">
                A.Y. {offering.academicYear?.yearStart}-{offering.academicYear?.yearEnd} •{' '}
                {offering.semester?.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{offering.course?.courseTitle}</h1>
            <p className="text-xs text-gray-500 mt-1">{offering.course?.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/faculty/course-offerings/${offering._id}/lessons`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <HiOutlineBookOpen className="w-4 h-4" />
              Manage Lessons & Quizzes
            </Link>
            <Link
              to={`/faculty/gradebook/${offering._id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm"
            >
              <HiOutlineChartBarSquare className="w-4 h-4" />
              Gradebook
            </Link>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <HiOutlineUserPlus className="w-4 h-4" />
              Enroll Student
            </button>
          </div>
        </div>
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Enrolled Students Roster</h2>
            <p className="text-xs text-gray-500">
              Students registered in this section and their curriculum completion progress
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            {students.filter((s) => s.enrollmentStatus === 'active').length} Active Students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program & Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curriculum Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No students enrolled yet. Click "Enroll Student" to add students to this class.
                  </td>
                </tr>
              ) : (
                students.map((item) => (
                  <tr key={item.enrollmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-gray-900">
                      {item.student.studentId}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <Link
                        to={`/faculty/students/${item.student._id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {item.student.firstName} {item.student.lastName}
                      </Link>
                      <p className="text-xs text-gray-400">{item.student.email}</p>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600">
                      {item.student.degreeProgram?.programCode || 'N/A'} • {item.student.section || 'A'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="w-36">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">
                            {item.completedLessons} / {item.totalLessons} lessons
                          </span>
                          <span className="text-indigo-600 font-semibold">{item.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${item.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          item.enrollmentStatus === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.enrollmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs">
                      {item.enrollmentStatus === 'active' && (
                        <button
                          onClick={() => handleDropStudent(item.enrollmentId)}
                          className="text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                          Drop
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowEnrollModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Enroll Student</h2>
            <p className="text-xs text-gray-500 mb-4">
              Select an officially registered student to add to {offering.course?.courseCode} -{' '}
              {offering.section}
            </p>

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Choose Student</label>
                {unenrolledCandidates.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    All currently registered students are already enrolled in this class offering.
                  </p>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {unenrolledCandidates.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.studentId} - {s.firstName} {s.lastName} ({s.degreeProgram?.programCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unenrolledCandidates.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseOfferingDetail;

