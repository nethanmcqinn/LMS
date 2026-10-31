import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineBookOpen,
  HiOutlineDocumentCheck,
  HiOutlinePaperClip,
  HiOutlineArrowDownTray,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineVideoCamera,
} from 'react-icons/hi2';

const StudentLesson = () => {
  const { courseOfferingId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      const res = await api.get(`/lessons/${lessonId}`);
      setLesson(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access denied to this lesson');
      navigate(`/student/courses/${courseOfferingId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading module materials...</div>;
  }

  if (!lesson) {
    return <div className="text-center py-12 text-red-500">Lesson not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to={`/student/courses/${courseOfferingId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Course Curriculum
      </Link>

      {/* Lesson Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
            Module {lesson.order}
          </span>
          {lesson.quizPassed && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
              <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Assessment Passed
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-xs text-gray-500 mt-1">{lesson.description}</p>
        )}
      </div>

      {/* Lesson Reading Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
          <HiOutlineBookOpen className="w-4 h-4 text-emerald-600" />
          Lesson Materials & Notes
        </h2>

        {lesson.content ? (
          <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50/60 p-5 rounded-xl border border-slate-100">
            {lesson.content}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No text content provided for this lesson.</p>
        )}

        {/* Video Resources */}
        {lesson.videoLinks && lesson.videoLinks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineVideoCamera className="w-4 h-4 text-rose-500" />
              Educational Video Resources
            </h3>
            <div className="space-y-2">
              {lesson.videoLinks.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs text-indigo-600 font-semibold border border-slate-200 transition"
                >
                  <HiOutlineVideoCamera className="w-4 h-4 text-rose-500" />
                  <span>{url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {lesson.attachments && lesson.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlinePaperClip className="w-4 h-4 text-indigo-600" />
              Downloadable Lesson Materials ({lesson.attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lesson.attachments.map((file, idx) => (
                <a
                  key={idx}
                  href={file.fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-xs transition"
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <HiOutlinePaperClip className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-800 truncate">{file.fileName}</span>
                  </div>
                  <HiOutlineArrowDownTray className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assessment Requirement Card */}
      {lesson.quiz ? (
        <div
          className={`rounded-2xl border p-6 shadow-sm ${
            lesson.quizPassed
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-white border-indigo-200 ring-2 ring-indigo-50'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Required Assessment
                </span>
                {lesson.quizPassed && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Completed ✓
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{lesson.quiz.title}</h3>
              <p className="text-xs text-gray-600 mt-1">
                Passing threshold: <span className="font-bold">{lesson.quiz.passingPercentage}%</span> •{' '}
                Total points: {lesson.quiz.totalPoints}
                {lesson.highestQuizScore !== null && (
                  <span>
                    {' '}
                    • Your highest score:{' '}
                    <strong className="text-emerald-700">{lesson.highestQuizScore}%</strong>
                  </span>
                )}
              </p>
            </div>

            <Link
              to={`/student/quiz/${lesson.quiz._id}`}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap ${
                lesson.quizPassed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <HiOutlineDocumentCheck className="w-4 h-4" />
              {lesson.quizPassed ? 'Retake / Review Quiz' : 'Start Quiz Assessment'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-gray-500">
          This lesson has no required quiz. Proceeding is automatically granted.
        </div>
      )}
    </div>
  );
};

export default StudentLesson;

