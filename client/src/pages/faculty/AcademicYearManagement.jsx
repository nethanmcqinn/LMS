import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendarDays,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineStar,
} from 'react-icons/hi2';

const AcademicYearManagement = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newYearStart, setNewYearStart] = useState(2027);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  const [semFormData, setSemFormData] = useState({
    name: 'First Semester',
    academicYear: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [yearRes, semRes] = await Promise.all([
        api.get('/academic-years'),
        api.get('/semesters'),
      ]);
      setAcademicYears(yearRes.data.data || []);
      setSemesters(semRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load academic periods');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic-years', {
        yearStart: Number(newYearStart),
        yearEnd: Number(newYearStart) + 1,
      });
      toast.success(`Academic Year ${newYearStart}-${Number(newYearStart) + 1} created`);
      setShowYearModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create academic year');
    }
  };

  const handleSetCurrentYear = async (id) => {
    try {
      await api.put(`/academic-years/${id}/set-current`);
      toast.success('Current academic year updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to set current academic year');
    }
  };

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    try {
      await api.post('/semesters', semFormData);
      toast.success('Semester created successfully');
      setShowSemesterModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create semester');
    }
  };

  const handleSetCurrentSemester = async (id) => {
    try {
      await api.put(`/semesters/${id}/set-current`);
      toast.success('Current active semester updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to set current semester');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Years & Semesters</h1>
          <p className="text-sm text-gray-500">
            Configure institutional academic periods, active academic years, and semester sessions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowYearModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Academic Year
          </button>
          <button
            onClick={() => {
              if (academicYears.length > 0) {
                setSemFormData((prev) => ({ ...prev, academicYear: academicYears[0]._id }));
              }
              setShowSemesterModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Semester
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Years List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineCalendarDays className="w-5 h-5 text-indigo-600" />
            Academic Years
          </h2>
          <div className="space-y-3">
            {academicYears.map((ay) => (
              <div
                key={ay._id}
                className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  ay.isCurrent
                    ? 'border-indigo-200 bg-indigo-50/50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900 font-mono">
                      {ay.yearStart} - {ay.yearEnd}
                    </span>
                    {ay.isCurrent && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        Current Active Year
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Official Institution Academic Period</p>
                </div>
                {!ay.isCurrent && (
                  <button
                    onClick={() => handleSetCurrentYear(ay._id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50"
                  >
                    Set Active
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Semesters List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineStar className="w-5 h-5 text-indigo-600" />
            Semesters
          </h2>
          <div className="space-y-3">
            {semesters.map((sem) => (
              <div
                key={sem._id}
                className={`p-4 rounded-xl border flex items-center justify-between transition ${
                  sem.isCurrent
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{sem.name}</span>
                    {sem.isCurrent && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                        Active Term
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    A.Y. {sem.academicYear?.yearStart} - {sem.academicYear?.yearEnd}
                  </p>
                </div>
                {!sem.isCurrent && (
                  <button
                    onClick={() => handleSetCurrentSemester(sem._id)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50"
                  >
                    Set Active Term
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Academic Year</h2>
            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Starting Year</label>
                <input
                  type="number"
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  min="2020"
                  max="2040"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will create: {newYearStart} - {Number(newYearStart) + 1}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Create Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semester Modal */}
      {showSemesterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Semester</h2>
            <form onSubmit={handleCreateSemester} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Semester</label>
                <select
                  value={semFormData.name}
                  onChange={(e) => setSemFormData({ ...semFormData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Academic Year</label>
                <select
                  value={semFormData.academicYear}
                  onChange={(e) => setSemFormData({ ...semFormData, academicYear: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono"
                >
                  {academicYears.map((ay) => (
                    <option key={ay._id} value={ay._id}>
                      {ay.yearStart} - {ay.yearEnd}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSemesterModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Create Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearManagement;

