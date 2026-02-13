import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => setAnalytics(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-gray-500">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
    </div>
  );

  const s = analytics?.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ['Total Students', s.total_students, '👥', 'from-blue-50 to-cyan-50 border-blue-200'],
          ['Total Assessments', s.total_assessments, '📝', 'bg-white border-gray-200'],
          ['Completed', s.completed_assessments, '✅', 'bg-white border-gray-200'],
          ['Participation', `${s.participation_rate}%`, '📊', 'from-green-50 to-emerald-50 border-green-200'],
        ].map(([label, value, icon, cls]) => (
          <div key={label} className={`bg-gradient-to-br ${cls} border rounded-xl p-5 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/questions" className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow hover:-translate-y-0.5 transition">
          <span className="text-3xl">📋</span>
          <div><div className="font-bold text-gray-900">Question Management</div><div className="text-xs text-gray-400">Add, edit, deactivate questions</div></div>
        </Link>
        <Link to="/admin/analytics" className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow hover:-translate-y-0.5 transition">
          <span className="text-3xl">📊</span>
          <div><div className="font-bold text-gray-900">Analytics</div><div className="text-xs text-gray-400">Detailed statistics & trends</div></div>
        </Link>
      </div>

      {/* Recent Assessments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Assessments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Student</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recent_assessments?.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{a.first_name} {a.last_name}</td>
                  <td className="py-3 px-4 text-gray-500">{a.email}</td>
                  <td className="py-3 px-4">{new Date(a.started_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${a.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dominant MI distribution */}
      {analytics?.dominant_mi?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Dominant Intelligence Distribution</h3>
          <div className="space-y-3">
            {analytics.dominant_mi.map(d => {
              const total = analytics.dominant_mi.reduce((sum, x) => sum + x.count, 0);
              const pct = (d.count / total * 100).toFixed(1);
              return (
                <div key={d.name} className="flex items-center gap-4">
                  <span className="w-36 text-sm font-medium text-gray-700 shrink-0">{d.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-14 text-right">{d.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
