import { useAuth } from '../context/AuthContext.jsx';
import { useAssessment } from '../hooks/useAssessment.js';
import { useEffect } from 'react';

export default function Profile() {
  const { user } = useAuth();
  const { fetchHistory, history } = useAssessment();

  useEffect(() => { fetchHistory().catch(() => {}); }, []);

  const completedCount = history.filter(a => a.status === 'completed').length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex flex-col sm:flex-row gap-8 items-start">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-3xl font-bold shrink-0">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>

        {/* Details */}
        <div className="flex-1 w-full divide-y divide-gray-100">
          {[
            ['Name', `${user?.first_name} ${user?.last_name}`],
            ['Email', user?.email],
            ['Gender', user?.gender || 'Not specified'],
            ['Birthdate', user?.birthdate ? new Date(user.birthdate).toLocaleDateString() : 'Not specified'],
            ['Role', user?.role],
            ['Member Since', user?.created_at && new Date(user.created_at).toLocaleDateString()],
            ['Assessments Completed', completedCount],
          ].map(([label, value]) => (
            <div key={label} className="flex py-3 first:pt-0">
              <span className="w-44 text-sm font-semibold text-gray-400 shrink-0">{label}</span>
              <span className="text-sm text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
