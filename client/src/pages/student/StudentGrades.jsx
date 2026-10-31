import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineTrophy,
  HiOutlineAcademicCap,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';

const StudentGrades = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcademicRecords();
  }, []);

  const fetchAcademicRecords = async () => {
    try {
      const res = await api.get('/grades/my-record');
      setRecords(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading academic records...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academic Grades & Performance</h1>
        <p className="text-sm text-gray-500">
          Official academic ratings, quiz assessment scores, and instructor remarks per enrolled course
        </p>
      </div>

      <div className="space-y-6">
        {records.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
            No academic grade records found. You must be actively enrolled in courses with published coursework.
          </div>
        ) : (
          records.map((item) => {
            const offering = item.courseOffering;
            const grade = item.grade;

            return (
              <div
                key={item.enrollmentId}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
                      {offering.course?.courseCode} - {offering.section}
                    </span>
                    <h2 className="text-base font-bold text-gray-900 mt-1">
                      {offering.course?.courseTitle}
                    </h2>
                  </div>
                  <div className="text-xs text-gray-500 sm:text-right">
                    <p className="font-semibold text-gray-700">
                      Instructor: Prof. {offering.faculty?.firstName} {offering.faculty?.lastName}
                    </p>
                    <p>
                      {offering.semester?.name} • A.Y. {offering.academicYear?.yearStart}-
                      {offering.academicYear?.yearEnd}
                    </p>
                  </div>
                </div>

                {/* Body: Overall Grade Summary */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                      <span className="text-xs uppercase font-bold text-emerald-800 block">
                        Overall Course Grade
                      </span>
                      <span className="text-3xl font-extrabold text-emerald-900 mt-1 block">
                        {grade?.overallGrade !== undefined && grade?.overallGrade !== null
                          ? `${grade.overallGrade}%`
                          : 'In Progress'}
                      </span>
                    </div>

                    <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                      <span className="text-xs uppercase font-bold text-indigo-800 block">
                        Letter Grade / Rating
                      </span>
                      <span className="text-3xl font-extrabold text-indigo-900 mt-1 block font-mono">
                        {grade?.letterGrade || 'Pending'}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-xs uppercase font-bold text-gray-600 block">
                        Instructor Remarks
                      </span>
                      <span className="text-sm font-semibold text-gray-800 mt-2 block">
                        {grade?.remarks || 'Good standing'}
                      </span>
                    </div>
                  </div>

                  {/* Quiz Assessment Breakdown */}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Individual Quiz Assessment Breakdown
                  </h3>

                  {(!grade?.quizGrades || grade.quizGrades.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">No quiz scores recorded yet for this course.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 text-xs">
                        <thead>
                          <tr className="text-gray-400 text-left">
                            <th className="py-2">Assessment</th>
                            <th className="py-2">Highest Score</th>
                            <th className="py-2">Score Percentage</th>
                            <th className="py-2">Requirement Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {grade.quizGrades.map((qg, qIdx) => (
                            <tr key={qIdx} className="text-gray-700">
                              <td className="py-2 font-semibold text-gray-900">
                                {qg.quiz?.title || 'Quiz Assessment'}
                              </td>
                              <td className="py-2">
                                {qg.highestScore} / {qg.totalPoints}
                              </td>
                              <td className="py-2 font-bold text-gray-900">
                                {qg.percentage}%
                              </td>
                              <td className="py-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    qg.passed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {qg.passed ? 'PASSED ✓' : 'FAILED ✗'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentGrades;

