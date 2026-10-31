import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUserCircle,
  HiOutlineIdentification,
  HiOutlineAcademicCap,
  HiOutlineCalendarDays,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';

const StudentProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/students/profile');
      setProfileData(res.data.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading student profile...</div>;
  }

  if (!profileData) {
    return <div className="text-center py-12 text-red-500">Profile record not found.</div>;
  }

  const { user, profile } = profileData;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Academic Profile</h1>
        <p className="text-sm text-gray-500">
          Official institutional identification, enrollment credentials, and academic standing
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-3xl shadow-md">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Verified Student Account
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {user.firstName} {user.middleName} {user.lastName}
            </h2>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Official Student ID Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider">
                Permanent Official Student ID
              </span>
              <p className="font-mono text-3xl font-extrabold text-emerald-950 mt-1">
                {profile?.studentId || 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
              <HiOutlineIdentification className="w-7 h-7" />
            </div>
          </div>
          <p className="text-xs text-emerald-800 mt-3 border-t border-emerald-200/80 pt-2">
            Structured format: <span className="font-mono font-bold">YYYY-PROGRAMCODE-SEQUENCE</span>.
            This identifier remains permanent throughout your academic journey even as you advance year levels.
          </p>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-gray-400 uppercase font-semibold block">Degree Program</span>
            <span className="text-sm font-bold text-gray-900 mt-1 block">
              {profile?.degreeProgram?.programName} ({profile?.degreeProgram?.programCode})
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-gray-400 uppercase font-semibold block">Current Year Level</span>
            <span className="text-sm font-bold text-gray-900 mt-1 block">
              Year {profile?.currentYearLevel}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-gray-400 uppercase font-semibold block">Initial Enrollment Year</span>
            <span className="text-sm font-bold text-gray-900 mt-1 block">
              {profile?.enrollmentYear}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-gray-400 uppercase font-semibold block">Section</span>
            <span className="text-sm font-bold text-gray-900 mt-1 block">
              {profile?.section || 'Section A'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
          <HiOutlineInformationCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p>
            Your student academic records and sequential learning progress are protected by backend
            access control policies. Grades and progress can only be updated through official instructor
            evaluations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

