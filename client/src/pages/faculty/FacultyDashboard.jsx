import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePlusCircle,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    passedStudents: 0,
    failedStudents: 0,
    incompleteStudents: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/course-offerings/dashboard/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Assessments', Passed: stats.passedStudents, Failed: stats.failedStudents, Incomplete: stats.incompleteStudents },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Faculty Dashboard</h1>
          <p className="text-sm text-gray-500">
            Overview of your academic classes, enrolled students, and learning assessments
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/faculty/course-offerings"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            Manage Classes
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Assigned Classes</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HiOutlineAcademicCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalCourses}</p>
          <span className="text-xs text-gray-400">Active course offerings</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Enrolled Students</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HiOutlineUserGroup className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalStudents}</p>
          <span className="text-xs text-gray-400">Total unique students</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Uploaded Lessons</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HiOutlineBookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalLessons}</p>
          <span className="text-xs text-gray-400">Curriculum units</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Active Quizzes</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiOutlineDocumentCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalQuizzes}</p>
          <span className="text-xs text-gray-400">Assessments created</span>
        </div>
      </div>

      {/* Student Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-1">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Assessment Outcomes</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-3">
                <HiOutlineCheckBadge className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Passed Assessments</p>
                  <p className="text-xs text-emerald-700">Met passing percentage</p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-700">{stats.passedStudents}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
              <div className="flex items-center gap-3">
                <HiOutlineXCircle className="w-6 h-6 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-900">Failed / Below Threshold</p>
                  <p className="text-xs text-rose-700">Needs retake or remediation</p>
                </div>
              </div>
              <span className="text-xl font-bold text-rose-700">{stats.failedStudents}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-3">
                <HiOutlineClock className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Incomplete Coursework</p>
                  <p className="text-xs text-amber-700">Pending required lessons</p>
                </div>
              </div>
              <span className="text-xl font-bold text-amber-700">{stats.incompleteStudents}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              to="/faculty/gradebook"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-between"
            >
              Open Full Gradebook
              <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Academic Completion Overview</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Passed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Incomplete" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Student Activity Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Quiz Submissions</h2>
          <span className="text-xs text-gray-500">Latest student attempts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score / %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempt #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {stats.recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No recent student quiz submissions yet.
                  </td>
                </tr>
              ) : (
                stats.recentActivity.map((activity) => (
                  <tr key={activity._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.student?.firstName} {activity.student?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{activity.student?.email}</p>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-700">
                      {activity.quiz?.title || 'Quiz'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {activity.score} / {activity.totalPoints}
                      </span>
                      <span className="ml-1.5 text-xs text-gray-500">({activity.percentage}%)</span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {activity.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">
                      Attempt {activity.attemptNumber}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {new Date(activity.submittedAt || activity.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

