import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineArrowRight,
  HiOutlineDocumentCheck,
  HiOutlineArrowLeft,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';

const StudentCourseDetail = () => {
  const { id } = useParams(); // courseOfferingId
  const navigate = useNavigate();

  const [offering, setOffering] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseAndLessons();
  }, [id]);

  const fetchCourseAndLessons = async () => {
    try {
      const [offeringRes, lessonsRes] = await Promise.all([
        api.get(`/course-offerings/${id}`),
        api.get(`/lessons/course-offering/${id}`),
      ]);
      setOffering(offeringRes.data.data);
      setLessons(lessonsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load course modules');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    if (lesson.status === 'locked') {
      toast.error(
        `Lesson ${lesson.order} is locked! You must first pass the assessment for Lesson ${
          lesson.order - 1
        }.`,
        { duration: 4000 }
      );
      return;
    }
    navigate(`/student/courses/${id}/lessons/${lesson._id}`);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading curriculum...</div>;
  }

  if (!offering) {
    return <div className="text-center py-12 text-red-500">Course not found.</div>;
  }

  const completedCount = lessons.filter((l) => l.status === 'completed' || l.quizPassed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/student/courses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to My Courses
      </Link>

      {/* Course Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md">
                {offering.course?.courseCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {offering.section}
              </span>
              <span className="text-xs text-gray-500">
                A.Y. {offering.academicYear?.yearStart}-{offering.academicYear?.yearEnd} •{' '}
                {offering.semester?.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{offering.course?.courseTitle}</h1>
            <p className="text-xs text-gray-500 mt-1">
              Instructor: {offering.faculty?.firstName} {offering.faculty?.lastName} (
              {offering.faculty?.email})
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center min-w-[130px]">
            <span className="text-2xl font-extrabold text-emerald-800 block">
              {progressPercent}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
              {completedCount} of {lessons.length} Completed
            </span>
          </div>
        </div>

        {/* Notice on progression requirement */}
        <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-700">
          <HiOutlineInformationCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <span>
            <strong className="text-slate-900">Sequential Learning Progression:</strong> Lessons must
            be studied in order. To unlock the next module, you must achieve a passing grade on the
            current lesson's quiz.
          </span>
        </div>
      </div>

      {/* Sequential Lessons List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Curriculum Modules</h2>

        {lessons.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
            No published lessons available yet for this course. Please check back soon.
          </div>
        ) : (
          lessons.map((lesson, idx) => {
            const isLocked = lesson.status === 'locked';
            const isCompleted = lesson.status === 'completed' || lesson.quizPassed;
            const isAvailable = !isLocked && !isCompleted;

            return (
              <div
                key={lesson._id}
                onClick={() => handleLessonClick(lesson)}
                className={`p-5 rounded-2xl border transition relative cursor-pointer ${
                  isCompleted
                    ? 'bg-white border-emerald-200 hover:border-emerald-300 shadow-sm'
                    : isAvailable
                    ? 'bg-white border-indigo-200 hover:border-indigo-400 shadow-md ring-2 ring-indigo-50'
                    : 'bg-gray-50 border-gray-200 opacity-75 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Status Badge Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isAvailable
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <HiOutlineCheckCircle className="w-7 h-7 text-emerald-600" />
                      ) : isLocked ? (
                        <HiOutlineLockClosed className="w-6 h-6 text-gray-400" />
                      ) : (
                        <span>{lesson.order}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Module {lesson.order}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isAvailable
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isCompleted
                            ? 'Completed ✓'
                            : isAvailable
                            ? 'Available Now'
                            : 'Locked'}
                        </span>
                      </div>

                      <h3
                        className={`text-base font-bold mt-1 ${
                          isLocked ? 'text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {lesson.title}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {isLocked
                          ? `Locked. Complete and pass the assessment for Lesson ${
                              lesson.order - 1
                            } to access this module.`
                          : lesson.description || 'Module reading materials and assessment.'}
                      </p>

                      {/* Quiz info tag */}
                      {!isLocked && (
                        <div className="mt-3 flex items-center gap-3 text-xs">
                          {lesson.quiz ? (
                            <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              <HiOutlineDocumentCheck className="w-4 h-4" />
                              Quiz Assessment (Passing score: {lesson.quiz.passingPercentage}%)
                            </span>
                          ) : (
                            <span className="text-gray-400">No quiz required</span>
                          )}
                          {lesson.highestQuizScore !== null && (
                            <span className="text-gray-600 font-semibold">
                              Best score: {lesson.highestQuizScore}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action arrow */}
                  <div className="self-center">
                    {!isLocked ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm">
                        Open
                        <HiOutlineArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-gray-400 p-2">
                        <HiOutlineLockClosed className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentCourseDetail;

