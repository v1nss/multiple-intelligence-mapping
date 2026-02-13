import { useEffect, useState } from 'react';
import api from '../services/api.js';
import BarChartComponent from '../components/BarChartComponent.jsx';

export default function AdminAnalytics() {
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
    <div className="max-w-7xl mx-auto px-4 py-8"><div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div></div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">System-wide statistics and trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ['Total Students', analytics?.summary?.total_students, '👥'],
          ['Assessments', analytics?.summary?.total_assessments, '📝'],
          ['Completed', analytics?.summary?.completed_assessments, '✅'],
          ['Participation Rate', `${analytics?.summary?.participation_rate}%`, '📊'],
        ].map(([label, value, icon]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {analytics?.avg_mi_scores?.length > 0 && (
          <BarChartComponent
            data={analytics.avg_mi_scores.map(s => ({ name: s.name, score: s.avg_score }))}
            title="Average MI Scores (All Students)"
            color="#4F46E5"
          />
        )}
        {analytics?.avg_riasec_scores?.length > 0 && (
          <BarChartComponent
            data={analytics.avg_riasec_scores.map(s => ({ name: s.name, score: s.avg_score }))}
            title="Average RIASEC Scores (All Students)"
            color="#0891B2"
          />
        )}
      </div>

      {/* Strand Distribution */}
      {analytics?.strand_distribution?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Top Strand Distribution</h3>
          <div className="space-y-3">
            {analytics.strand_distribution.map(s => {
              const total = analytics.strand_distribution.reduce((sum, x) => sum + x.count, 0);
              const pct = (s.count / total * 100).toFixed(1);
              return (
                <div key={s.strand} className="flex items-center gap-4">
                  <span className="w-32 text-sm font-medium text-gray-700 shrink-0">{s.strand}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-16 text-right">{s.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dominant MI */}
      {analytics?.dominant_mi?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Dominant Intelligence Frequency</h3>
          <div className="space-y-3">
            {analytics.dominant_mi.map(d => {
              const total = analytics.dominant_mi.reduce((sum, x) => sum + x.count, 0);
              const pct = (d.count / total * 100).toFixed(1);
              return (
                <div key={d.name} className="flex items-center gap-4">
                  <span className="w-40 text-sm font-medium text-gray-700 shrink-0">{d.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-16 text-right">{d.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gender Trends */}
      {analytics?.gender_trends?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Gender-Based Intelligence Trends</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Gender</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Domain</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.gender_trends.map((t, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 capitalize">{t.gender}</td>
                    <td className="py-2.5 px-3">{t.domain}</td>
                    <td className="py-2.5 px-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${t.type === 'MI' ? 'bg-indigo-50 text-indigo-700' : 'bg-cyan-50 text-cyan-700'}`}>{t.type}</span></td>
                    <td className="py-2.5 px-3">{(t.avg_score * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
