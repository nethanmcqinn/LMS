import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineChartBarSquare,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineBookOpen,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

const StudentProgress = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const res = await api.get('/course-offerings');
      setCourses(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading progress...</div>;
  }

  const totalLessonsOverall = courses.reduce((sum, c) => sum + (c.lessonCount || 0), 0);
  const totalCompletedOverall = courses.reduce((sum, c) => sum + (c.completedLessons || 0), 0);
  const overallPercentage =
    totalLessonsOverall > 0 ? Math.round((totalCompletedOverall / totalLessonsOverall) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Progress & Milestones</h1>
        <p className="text-sm text-gray-500">
          Track completed educational modules and sequential progression across all your enrolled classes
        </p>
      </div>

      {/* Aggregate Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
          Cumulative Academic Progression
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
              <span>Overall Curriculum Completion</span>
              <span className="text-emerald-700 font-bold">{overallPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Satisfied {totalCompletedOverall} of {totalLessonsOverall} required curriculum modules across{' '}
              {courses.length} courses
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center min-w-[120px]">
            <span className="text-3xl font-extrabold text-emerald-800 block">{overallPercentage}%</span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Progress</span>
          </div>
        </div>
      </div>

      {/* Per-Course Progression Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Course Progress Breakdown</h2>

        {courses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
            No courses found to display progress.
          </div>
        ) : (
          courses.map((course) => {
            const completed = course.completedLessons || 0;
            const total = course.lessonCount || 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={course._id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
                      {course.course?.courseCode}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{course.section}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{course.course?.courseTitle}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Instructor: {course.faculty?.firstName} {course.faculty?.lastName}
                  </p>

                  <div className="mt-4 max-w-md">
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Course Completion</span>
                      <span className="font-bold text-emerald-700">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {completed} of {total} lessons satisfied
                    </span>
                  </div>
                </div>

                <div className="self-end md:self-center">
                  <Link
                    to={`/student/courses/${course._id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <HiOutlineBookOpen className="w-4 h-4" />
                    View Course Modules
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

export default StudentProgress;

