import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api.js';

const STRAND_COLORS = ['#22c55e', '#3b82f6', '#1e3a5f', '#f97316', '#a855f7', '#ec4899', '#14b8a6'];
const STRAND_LABELS = {
  'STEM': 'Science, Technology, Engineering',
  'ABM': 'Accountancy, Business, Management',
  'HUMSS': 'Humanities & Social Sciences',
  'GAS': 'General Academic Strand',
  'TVL': 'Technical-Vocational-Livelihood',
  'Sports': 'Sports Track',
  'Arts and Design': 'Arts & Design Track',
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/admin/analytics')
      .then(res => setAnalytics(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-gray-500">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-sm">Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
    </div>
  );

  const s = analytics?.summary || {};
  const strandRanking = analytics?.strand_ranking || [];
  const recentAssessments = analytics?.recent_assessments || [];
  const miScores = analytics?.avg_mi_scores || [];
  const riasecScores = analytics?.avg_riasec_scores || [];

  // Build chart data for "School Insights" — MI vs RIASEC avg scores
  const chartData = miScores.map(mi => ({
    name: mi.name.length > 10 ? mi.name.substring(0, 8) + '…' : mi.name,
    'MI Score': Math.round(mi.avg_score * 100),
  }));

  // Top strand for the featured card
  const topStrand = strandRanking[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">System overview and management controls.</p>
        </div>
        <Link
          to="/admin/questions"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-sm whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Manage Questions
        </Link>
      </div>

      {/* ─── Summary Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* Total Candidates */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Candidates</p>
          <p className="text-3xl font-extrabold text-gray-900">{s.total_students?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Registered students</p>
        </div>

        {/* Active Students */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V21" /></svg>
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Active Students</p>
          <p className="text-3xl font-extrabold text-gray-900">{s.active_students?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Currently engaged</p>
        </div>

        {/* Total Submissions */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Submissions</p>
          <p className="text-3xl font-extrabold text-gray-900">{s.completed_assessments?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Completed assessments</p>
        </div>
      </div>

      {/* ─── School Insights + Result Distribution ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* School Insights — Bar Chart */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">School Insights</h2>
              <p className="text-xs text-gray-400">Assessment analytics overview</p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-500">
              All Time
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Avg Score']}
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                <Bar dataKey="MI Score" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No data available yet</div>
          )}
        </div>

        {/* Result Distribution */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">Result Distribution</h2>
            <p className="text-xs text-gray-400">Aggregate outcome metrics</p>
          </div>

          {strandRanking.length > 0 ? (
            <div className="space-y-3">
              {/* Featured top strand */}
              {topStrand && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <span className="text-sm">🏆</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{topStrand.strand}</p>
                        <p className="text-[10px] text-gray-400">Highest Frequency</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-green-600">{Math.round(topStrand.avg_score * 100)}%</p>
                      <p className="text-[10px] font-semibold text-green-500 uppercase">High</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-1.5">Dominant Result</p>
                  <p className="text-[10px] text-gray-500 mb-2">{STRAND_LABELS[topStrand.strand] || topStrand.strand}</p>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${topStrand.avg_score * 100}%` }}></div>
                  </div>
                </div>
              )}

              {/* Remaining strands */}
              {strandRanking.slice(1, 4).map((s, i) => (
                <div key={s.strand} className="flex items-center gap-3 px-1">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    #{i + 2}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{s.strand}</p>
                        <p className="text-[10px] text-gray-400">{STRAND_LABELS[s.strand]?.split(',')[0] || ''}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: STRAND_COLORS[i + 1] || '#3b82f6' }}>
                        {Math.round(s.avg_score * 100)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${s.avg_score * 100}%`,
                          backgroundColor: STRAND_COLORS[i + 1] || '#3b82f6',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No results yet</div>
          )}
        </div>
      </div>

      {/* ─── Recent Submissions ────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Submissions</h2>
            <p className="text-xs text-gray-400">Latest assessment results from candidates</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-blue-600 transition"
            >
              View Full History
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Candidate</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessment</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Submitted</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Result</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentAssessments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No submissions yet</td></tr>
              ) : (
                recentAssessments.filter(a => a.status === 'completed').slice(0, 8).map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {a.first_name?.[0]}{a.last_name?.[0]}
                        </div>
                        <span className="font-semibold text-gray-900">{a.first_name} {a.last_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{a.version_name || 'MIPQ III + RIASEC'}</td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.top_strand ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 uppercase tracking-wide">
                          {a.top_strand}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button className="w-8 h-8 rounded-full hover:bg-gray-100 inline-flex items-center justify-center transition text-gray-400 hover:text-blue-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
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
}
