import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineUserCircle,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/course-offerings');
      setCourses(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Enrolled Courses</h1>
        <p className="text-sm text-gray-500">
          Access your enrolled academic subjects, course syllabus modules, and sequential lessons
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading your courses...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
            You are not currently enrolled in any courses. Please contact your instructor.
          </div>
        ) : (
          courses.map((offering) => {
            const completedCount = offering.completedLessons || 0;
            const totalCount = offering.lessonCount || 0;
            const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={offering._id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md">
                      {offering.course?.courseCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {offering.section}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 leading-snug">
                    {offering.course?.courseTitle}
                  </h2>

                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {offering.course?.description || 'Academic subject curriculum.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <HiOutlineUserCircle className="w-4 h-4 text-emerald-600" />
                      Prof. {offering.faculty?.firstName} {offering.faculty?.lastName}
                    </p>
                    <p className="text-gray-400">
                      {offering.semester?.name} • A.Y. {offering.academicYear?.yearStart}-
                      {offering.academicYear?.yearEnd}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Curriculum Progression</span>
                      <span className="text-emerald-700 font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {completedCount} of {totalCount} lessons completed
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link
                    to={`/student/courses/${offering._id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <HiOutlineBookOpen className="w-4 h-4" />
                    Open Course Lessons
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentCourses;

