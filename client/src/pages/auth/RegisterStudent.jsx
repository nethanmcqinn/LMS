import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineAcademicCap, HiOutlineIdentification, HiOutlineCheckCircle } from 'react-icons/hi2';

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    degreeProgram: '',
    enrollmentYear: new Date().getFullYear(),
    yearLevel: 1,
    section: 'Section A',
  });

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredStudentId, setRegisteredStudentId] = useState(null);

  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/programs');
      setPrograms(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setFormData((prev) => ({ ...prev, degreeProgram: res.data.data[0]._id }));
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.degreeProgram) {
      toast.error('Please select a degree program');
      return;
    }

    try {
      setLoading(true);
      const res = await registerStudent({
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        degreeProgram: formData.degreeProgram,
        enrollmentYear: Number(formData.enrollmentYear),
        yearLevel: Number(formData.yearLevel),
        section: formData.section,
      });

      setRegisteredStudentId(res.studentId);
      toast.success(`Registered! Your Student ID is ${res.studentId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (registeredStudentId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-emerald-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <HiOutlineCheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Registration Complete!</h2>
          <p className="text-sm text-gray-600 mt-2">
            Your official academic student account has been created with the following official identifier:
          </p>
          <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xs uppercase tracking-wider text-emerald-700 font-semibold block">
              Official Student ID
            </span>
            <span className="text-2xl font-mono font-bold text-emerald-900 mt-1 block">
              {registeredStudentId}
            </span>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow transition"
          >
            Go to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-md mb-3">
            <HiOutlineIdentification className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Student Registration</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create an official student account. Your Student ID will be generated automatically.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min 6 characters"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Academic Information</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Degree Program *</label>
                  <select
                    name="degreeProgram"
                    value={formData.degreeProgram}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    {programs.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.programCode} - {p.programName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Enrollment Year</label>
                    <input
                      type="number"
                      name="enrollmentYear"
                      value={formData.enrollmentYear}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Initial Year Level</label>
                    <select
                      name="yearLevel"
                      value={formData.yearLevel}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Section</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      placeholder="e.g. 1-A"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow text-sm disabled:opacity-50 transition"
              >
                {loading ? 'Creating Account & Generating ID...' : 'Complete Registration'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-gray-600 hover:text-emerald-600">
              Already have an account? <span className="font-semibold text-emerald-600">Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;

