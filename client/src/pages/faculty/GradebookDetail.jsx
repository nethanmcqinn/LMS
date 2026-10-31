import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineChartBarSquare,
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlinePencilSquare,
  HiOutlineXMark,
} from 'react-icons/hi2';

const GradebookDetail = () => {
  const { courseOfferingId } = useParams();
  const [gradebookData, setGradebookData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editing grade state
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    overallGrade: '',
    letterGrade: '',
    remarks: '',
  });

  useEffect(() => {
    fetchGradebook();
  }, [courseOfferingId]);

  const fetchGradebook = async () => {
    try {
      const res = await api.get(`/grades/gradebook/${courseOfferingId}`);
      setGradebookData(res.data.data);
    } catch (error) {
      toast.error('Failed to load gradebook matrix');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (studentItem) => {
    setEditingGrade(studentItem);
    setFormData({
      overallGrade: studentItem.overallGrade ?? studentItem.averageQuizPercentage ?? '',
      letterGrade: studentItem.letterGrade || '',
      remarks: studentItem.remarks || '',
    });
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/grades/${editingGrade.gradeId || 'new'}`, {
        student: editingGrade.student._id,
        courseOffering: courseOfferingId,
        overallGrade: Number(formData.overallGrade),
        letterGrade: formData.letterGrade,
        remarks: formData.remarks,
      });

      toast.success(`Grade updated for ${editingGrade.student.firstName} ${editingGrade.student.lastName}`);
      setEditingGrade(null);
      fetchGradebook();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update grade');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading gradebook matrix...</div>;
  }

  if (!gradebookData) {
    return <div className="text-center py-12 text-red-500">Gradebook not found.</div>;
  }

  const { courseOffering, quizzes, students } = gradebookData;

  return (
    <div className="space-y-6">
      <Link
        to="/faculty/gradebook"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Gradebook List
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                {courseOffering.course?.courseCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {courseOffering.section}
              </span>
              <span className="text-xs text-gray-500">
                A.Y. {courseOffering.academicYear?.yearStart}-{courseOffering.academicYear?.yearEnd} •{' '}
                {courseOffering.semester?.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{courseOffering.course?.courseTitle}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 bg-slate-50 border rounded-lg font-semibold text-gray-700">
              {students.length} Students
            </span>
            <span className="px-3 py-1.5 bg-slate-50 border rounded-lg font-semibold text-gray-700">
              {quizzes.length} Quizzes
            </span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Student ID
                </th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider sticky left-28 bg-gray-50 z-10">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">
                  Program
                </th>

                {/* Dynamic columns for each Quiz */}
                {quizzes.map((quiz) => (
                  <th
                    key={quiz._id}
                    className="px-4 py-3 text-center font-bold text-indigo-900 uppercase tracking-wider min-w-[120px]"
                  >
                    <p className="truncate max-w-[140px]" title={quiz.title}>
                      {quiz.title}
                    </p>
                    <span className="text-[10px] text-gray-400 font-normal">
                      Pass: {quiz.passingPercentage}% ({quiz.totalPoints} pts)
                    </span>
                  </th>
                ))}

                <th className="px-4 py-3 text-center font-bold text-gray-700 uppercase tracking-wider bg-slate-100">
                  Quiz Avg %
                </th>
                <th className="px-4 py-3 text-center font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50">
                  Overall Grade
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 uppercase tracking-wider">
                  Letter Grade
                </th>
                <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={quizzes.length + 8} className="px-6 py-8 text-center text-gray-400">
                    No enrolled students in this course offering.
                  </td>
                </tr>
              ) : (
                students.map((row) => (
                  <tr key={row.enrollmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 sticky left-0 bg-white">
                      {row.student.studentId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 sticky left-28 bg-white whitespace-nowrap">
                      {row.student.firstName} {row.student.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {row.student.degreeProgram}
                    </td>

                    {/* Quiz Scores */}
                    {row.quizResults.map((qr) => (
                      <td key={qr.quizId} className="px-4 py-3 text-center whitespace-nowrap">
                        {qr.percentage !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                qr.passed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {qr.highestScore} / {qr.totalPoints} ({qr.percentage}%)
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {qr.attemptsCount} attempt(s)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-mono">-</span>
                        )}
                      </td>
                    ))}

                    {/* Average Quiz % */}
                    <td className="px-4 py-3 text-center font-bold text-gray-900 bg-slate-50">
                      {row.averageQuizPercentage !== null ? `${row.averageQuizPercentage}%` : '-'}
                    </td>

                    {/* Overall Grade */}
                    <td className="px-4 py-3 text-center font-bold text-emerald-700 bg-emerald-50/50">
                      {row.overallGrade !== null && row.overallGrade !== undefined
                        ? `${row.overallGrade}%`
                        : '-'}
                    </td>

                    {/* Letter Grade */}
                    <td className="px-4 py-3 text-center font-bold text-indigo-700 font-mono">
                      {row.letterGrade || '-'}
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate" title={row.remarks}>
                      {row.remarks || '-'}
                    </td>

                    {/* Edit Grade Button */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Grade & Remarks"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Grade Modal */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingGrade(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Record Grade & Remarks
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Student: {editingGrade.student.firstName} {editingGrade.student.lastName} (
              {editingGrade.student.studentId})
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Overall Grade (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.overallGrade}
                  onChange={(e) => setFormData({ ...formData, overallGrade: e.target.value })}
                  placeholder="e.g. 88"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Academic Letter Grade / Rating
                </label>
                <input
                  type="text"
                  value={formData.letterGrade}
                  onChange={(e) => setFormData({ ...formData, letterGrade: e.target.value })}
                  placeholder="e.g. 1.50 or A"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Instructor Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Passed with High Honors"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradebookDetail;

