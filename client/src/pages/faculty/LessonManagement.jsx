import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineBookOpen,
  HiOutlinePlus,
  HiOutlineDocumentCheck,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePaperClip,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineVideoCamera,
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlineEye,
} from 'react-icons/hi2';

const LessonManagement = () => {
  const { id } = useParams(); // courseOfferingId
  const [offering, setOffering] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoLinks: '',
    isPublished: true,
    requiresQuiz: true,
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchLessons();
  }, [id]);

  const fetchLessons = async () => {
    try {
      const [offeringRes, lessonsRes] = await Promise.all([
        api.get(`/course-offerings/${id}`),
        api.get(`/lessons/course-offering/${id}`),
      ]);
      setOffering(offeringRes.data.data);
      setLessons(lessonsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      videoLinks: '',
      isPublished: true,
      requiresQuiz: true,
    });
    setFiles([]);
    setShowModal(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      videoLinks: (lesson.videoLinks || []).join('\n'),
      isPublished: lesson.isPublished,
      requiresQuiz: lesson.requiresQuiz,
    });
    setFiles([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('courseOffering', id);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('content', formData.content);
    data.append('isPublished', formData.isPublished);
    data.append('requiresQuiz', formData.requiresQuiz);

    const videoArr = formData.videoLinks
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
    data.append('videoLinks', JSON.stringify(videoArr));

    for (let i = 0; i < files.length; i++) {
      data.append('attachments', files[i]);
    }

    try {
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Lesson updated successfully');
      } else {
        await api.post('/lessons', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Lesson created successfully');
      }
      setShowModal(false);
      fetchLessons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson and its quiz?')) return;

    try {
      await api.delete(`/lessons/${lessonId}`);
      toast.success('Lesson deleted');
      fetchLessons();
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const newLessons = [...lessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    const orders = newLessons.map((l, idx) => ({
      lessonId: l._id,
      order: idx + 1,
    }));

    try {
      await api.put(`/lessons/reorder/${id}`, { orders });
      setLessons(newLessons.map((l, idx) => ({ ...l, order: idx + 1 })));
      toast.success('Lesson order updated');
    } catch (error) {
      toast.error('Failed to reorder lessons');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/faculty/course-offerings" className="hover:text-indigo-600">
          Classes
        </Link>
        <span>/</span>
        <Link to={`/faculty/course-offerings/${id}`} className="hover:text-indigo-600">
          {offering?.course?.courseCode} ({offering?.section})
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Curriculum Lessons</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lessons & Quizzes: {offering?.course?.courseTitle}
          </h1>
          <p className="text-sm text-gray-500">
            Order lessons sequentially. Students must pass each lesson's quiz before progressing to the next.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add Lesson
        </button>
      </div>

      {/* Lesson List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading lessons...</div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
            No lessons added yet. Click "Add Lesson" to create your first curriculum module.
          </div>
        ) : (
          lessons.map((lesson, idx) => (
            <div
              key={lesson._id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-indigo-200 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center p-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold min-w-[3rem]">
                    <span className="text-xs uppercase text-indigo-500">Lesson</span>
                    <span className="text-xl">{lesson.order}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{lesson.title}</h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          lesson.isPublished
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lesson.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {lesson.description || 'No description provided.'}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                      {lesson.attachments?.length > 0 && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <HiOutlinePaperClip className="w-4 h-4 text-indigo-500" />
                          {lesson.attachments.length} attachment(s)
                        </span>
                      )}
                      {lesson.videoLinks?.length > 0 && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <HiOutlineVideoCamera className="w-4 h-4 text-rose-500" />
                          {lesson.videoLinks.length} video link(s)
                        </span>
                      )}
                      {lesson.quiz ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <HiOutlineDocumentCheck className="w-4 h-4 text-emerald-600" />
                          Quiz: {lesson.quiz.title} (Passing: {lesson.quiz.passingPercentage}%)
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] font-medium">
                          No Quiz Configured (Required for Progression)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {/* Reorder buttons */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <button
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-white text-gray-500 disabled:opacity-30 transition"
                      title="Move Up"
                    >
                      <HiOutlineArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === lessons.length - 1}
                      className="p-1.5 hover:bg-white text-gray-500 disabled:opacity-30 transition"
                      title="Move Down"
                    >
                      <HiOutlineArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/faculty/course-offerings/${id}/quizzes/${lesson._id}`}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition flex items-center gap-1"
                  >
                    <HiOutlineDocumentCheck className="w-4 h-4" />
                    {lesson.quiz ? 'Manage Quiz' : 'Create Quiz'}
                  </Link>

                  <button
                    onClick={() => openEditModal(lesson)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition"
                    title="Edit Lesson"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteLesson(lesson._id)}
                    className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-gray-100 transition"
                    title="Delete Lesson"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lesson Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Lesson Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Introduction to Control Structures"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Short Summary / Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief overview of concepts covered in this module..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Lesson Content (Text / Notes)</label>
                <textarea
                  rows="6"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Comprehensive lecture notes, code examples, instructions..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Video Links (one per line)</label>
                <textarea
                  rows="2"
                  value={formData.videoLinks}
                  onChange={(e) => setFormData({ ...formData, videoLinks: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=...&#10;https://vimeo.com/..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Upload Attachments (PDF, DOCX, PPTX, Images, Video)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  className="mt-1 block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-gray-700">Publish immediately</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresQuiz}
                    onChange={(e) => setFormData({ ...formData, requiresQuiz: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-gray-700">Require quiz to unlock next</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {editingLesson ? 'Save Changes' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonManagement;

