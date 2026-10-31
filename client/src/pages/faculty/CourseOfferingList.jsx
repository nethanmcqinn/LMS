import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineArrowRight,
  HiOutlineXMark,
  HiOutlineChartBarSquare,
} from 'react-icons/hi2';

const CourseOfferingList = () => {
  const [offerings, setOfferings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    course: '',
    academicYear: '',
    semester: '',
    section: 'Section A',
    yearLevel: 1,
    degreeProgram: '',
    maxStudents: 45,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [offeringRes, courseRes, yearRes, semRes, progRes] = await Promise.all([
        api.get('/course-offerings'),
        api.get('/courses'),
        api.get('/academic-years'),
        api.get('/semesters'),
        api.get('/programs'),
      ]);

      setOfferings(offeringRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setAcademicYears(yearRes.data.data || []);
      setSemesters(semRes.data.data || []);
      setPrograms(progRes.data.data || []);

      if (courseRes.data.data?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          course: courseRes.data.data[0]._id,
          academicYear: yearRes.data.data?.find((y) => y.isCurrent)?._id || yearRes.data.data?.[0]?._id || '',
          semester: semRes.data.data?.find((s) => s.isCurrent)?._id || semRes.data.data?.[0]?._id || '',
          degreeProgram: progRes.data.data?.[0]?._id || '',
        }));
      }
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffering = async (e) => {
    e.preventDefault();
    try {
      await api.post('/course-offerings', formData);
      toast.success('Course offering created successfully');
      setShowModal(false);
      const res = await api.get('/course-offerings');
      setOfferings(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course offering');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes & Course Offerings</h1>
          <p className="text-sm text-gray-500">
            Manage your assigned class sections, curriculum lessons, quizzes, and enrolled student rosters
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Create Course Offering
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading your classes...</div>
        ) : offerings.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
            No class offerings found. Click "Create Course Offering" to schedule a class.
          </div>
        ) : (
          offerings.map((offering) => (
            <div
              key={offering._id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                    {offering.course?.courseCode}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                    {offering.section}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {offering.course?.courseTitle}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>
                    <span className="font-medium text-gray-700">Term:</span>{' '}
                    {offering.semester?.name} • A.Y. {offering.academicYear?.yearStart}-
                    {offering.academicYear?.yearEnd}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Program / Level:</span>{' '}
                    {offering.degreeProgram?.programCode || 'All'} - Year {offering.yearLevel}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-lg font-bold text-gray-900 block">{offering.lessonCount || 0}</span>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide">Lessons</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-lg font-bold text-indigo-600 block">{offering.enrolledCount || 0}</span>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide">Students</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/80 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <Link
                  to={`/faculty/course-offerings/${offering._id}/lessons`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <HiOutlineBookOpen className="w-4 h-4" />
                  Lessons & Quizzes
                </Link>
                <Link
                  to={`/faculty/course-offerings/${offering._id}`}
                  className="text-xs font-semibold text-gray-700 hover:text-indigo-600 flex items-center gap-1"
                >
                  Details
                  <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Course Offering</h2>

            <form onSubmit={handleCreateOffering} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Course Subject *</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode} - {c.courseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Academic Year *</label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay._id} value={ay._id}>
                        {ay.yearStart} - {ay.yearEnd} {ay.isCurrent ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {semesters.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Section *</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    required
                    placeholder="Section A"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Year Level</label>
                  <select
                    value={formData.yearLevel}
                    onChange={(e) => setFormData({ ...formData, yearLevel: Number(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Max Students</label>
                  <input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Degree Program Target</label>
                <select
                  value={formData.degreeProgram}
                  onChange={(e) => setFormData({ ...formData, degreeProgram: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">All Programs / Open</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.programCode} - {p.programName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Create Class Offering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseOfferingList;

