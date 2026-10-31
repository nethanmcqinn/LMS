import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedProgram, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedProgram) queryParams.append('degreeProgram', selectedProgram);
      if (selectedYear) queryParams.append('yearLevel', selectedYear);
      if (search) queryParams.append('search', search);

      const [studentsRes, programsRes] = await Promise.all([
        api.get(`/faculty/students?${queryParams.toString()}`),
        api.get('/programs'),
      ]);

      setStudents(studentsRes.data.data || []);
      setPrograms(programsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
          <p className="text-sm text-gray-500">
            View officially registered students, permanent Student IDs, and degree program affiliations
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <HiOutlineMagnifyingGlass className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student ID, name, or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </form>

        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Programs</option>
          {programs.map((p) => (
            <option key={p._id} value={p._id}>
              {p.programCode} - {p.programName}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Year Levels</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Official Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name & Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Degree Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Year Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No registered students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{student.email}</p>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-700 font-medium">
                      {student.degreeProgram?.programCode} - {student.degreeProgram?.programName}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-700">
                      Year {student.currentYearLevel}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-700">
                      {student.section || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs">
                      <Link
                        to={`/faculty/students/${student._id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold inline-flex items-center gap-1"
                      >
                        Academic Profile
                        <HiOutlineArrowRight className="w-3.5 h-3.5" />
                      </Link>
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

export default StudentManagement;

