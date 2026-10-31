import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingLibrary,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    programName: '',
    programCode: '',
    description: '',
    availableYearLevels: [1, 2, 3, 4],
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/programs');
      setPrograms(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load degree programs');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProgram(null);
    setFormData({
      programName: '',
      programCode: '',
      description: '',
      availableYearLevels: [1, 2, 3, 4],
    });
    setShowModal(true);
  };

  const openEditModal = (prog) => {
    setEditingProgram(prog);
    setFormData({
      programName: prog.programName,
      programCode: prog.programCode,
      description: prog.description || '',
      availableYearLevels: prog.availableYearLevels || [1, 2, 3, 4],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProgram) {
        await api.put(`/programs/${editingProgram._id}`, formData);
        toast.success('Program updated successfully');
      } else {
        await api.post('/programs', formData);
        toast.success('Program created successfully');
      }
      setShowModal(false);
      fetchPrograms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to archive this degree program?')) return;
    try {
      await api.delete(`/programs/${id}`);
      toast.success('Program archived');
      fetchPrograms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Degree Programs</h1>
          <p className="text-sm text-gray-500">
            Define academic curricula, program codes, and year levels for student enrollment
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add Degree Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading degree programs...</div>
        ) : programs.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
            No degree programs configured yet. Click "Add Degree Program" to create one.
          </div>
        ) : (
          programs.map((prog) => (
            <div
              key={prog._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-100 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                    {prog.programCode}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <button
                      onClick={() => openEditModal(prog)}
                      className="p-1 hover:text-indigo-600 transition"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeactivate(prog._id)}
                      className="p-1 hover:text-rose-600 transition"
                      title="Archive"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mt-2">{prog.programName}</h3>
                <p className="text-xs text-gray-500 mt-1.5 line-clamp-3">
                  {prog.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                <span>Year Levels:</span>
                <span className="font-medium text-gray-700">
                  {prog.availableYearLevels?.map((y) => `Yr ${y}`).join(', ') || '1 to 4'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingProgram ? 'Edit Degree Program' : 'New Degree Program'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Program Code * (e.g. BSIT)</label>
                <input
                  type="text"
                  value={formData.programCode}
                  onChange={(e) =>
                    setFormData({ ...formData, programCode: e.target.value.toUpperCase() })
                  }
                  required
                  placeholder="BSIT"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Program Name *</label>
                <input
                  type="text"
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                  required
                  placeholder="Bachelor of Science in Information Technology"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Program overview and objectives..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {editingProgram ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;

