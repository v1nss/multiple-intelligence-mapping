import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAssessment } from '../hooks/useAssessment.js';
import RadarChartComponent from '../components/RadarChartComponent.jsx';
import BarChartComponent from '../components/BarChartComponent.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchHistory, fetchResult, downloadReport, history, loading, error } = useAssessment();
  const [latestResult, setLatestResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  useEffect(() => {
    fetchHistory().then(assessments => {
      const completed = assessments?.filter(a => a.status === 'completed');
      if (completed?.length > 0) {
        setResultLoading(true);
        fetchResult(completed[0].id).then(data => setLatestResult(data)).catch(() => {}).finally(() => setResultLoading(false));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.first_name}!</h1>
        <p className="text-gray-500 mt-1">Your Multiple Intelligence Profile</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

      {!latestResult && !resultLoading && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No assessments yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Take your first MIPQ III + RIASEC assessment to discover your intelligence profile.</p>
          <button onClick={() => navigate('/assessment')} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-lg">
            Start Assessment
          </button>
        </div>
      )}

      {resultLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p>Loading your results...</p>
        </div>
      )}

      {latestResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 text-center hover:-translate-y-0.5 transition shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Dominant Intelligence</div>
              <div className="text-xl font-bold text-gray-900">{latestResult.mi_scores?.[0]?.domain || '—'}</div>
              <div className="text-sm text-gray-500 mt-1">{latestResult.mi_scores?.[0] && `${(latestResult.mi_scores[0].normalized_score * 100).toFixed(1)}%`}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:-translate-y-0.5 transition shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Top RIASEC</div>
              <div className="text-xl font-bold text-gray-900">{latestResult.riasec_scores?.[0]?.domain || '—'}</div>
              <div className="text-sm text-gray-500 mt-1">{latestResult.riasec_scores?.[0] && `${(latestResult.riasec_scores[0].normalized_score * 100).toFixed(1)}%`}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:-translate-y-0.5 transition shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Recommended Strand</div>
              <div className="text-xl font-bold text-gray-900">{latestResult.strand_ranking?.[0]?.strand || '—'}</div>
              <div className="text-sm text-gray-500 mt-1">{latestResult.strand_ranking?.[0] && `Score: ${(latestResult.strand_ranking[0].score * 100).toFixed(1)}%`}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:-translate-y-0.5 transition shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Top Career Match</div>
              <div className="text-base font-bold text-gray-900">{latestResult.career_suggestions?.[0]?.career || '—'}</div>
              <div className="text-sm text-gray-500 mt-1">{latestResult.career_suggestions?.[0] && `Match: ${(latestResult.career_suggestions[0].score * 100).toFixed(1)}%`}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <RadarChartComponent data={latestResult.mi_scores} title="Multiple Intelligence Radar" color="#4F46E5" />
            <RadarChartComponent data={latestResult.riasec_scores} title="RIASEC Profile" color="#0891B2" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <BarChartComponent data={latestResult.strand_ranking.map(s => ({ name: s.strand, score: s.score }))} title="SHS Strand Ranking" />
            <BarChartComponent data={latestResult.career_suggestions.slice(0, 8).map(c => ({ name: c.career, score: c.score }))} title="Top Career Matches" color="#7C3AED" />
          </div>

          {/* Career List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Career Recommendations</h3>
            <div className="divide-y divide-gray-100">
              {latestResult.career_suggestions.map((c, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <span className="text-sm font-bold text-indigo-600 w-9">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{c.career}</div>
                    <div className="text-xs text-gray-400 truncate">{c.description}</div>
                  </div>
                  <span className="text-sm font-bold text-green-600">{(c.score * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => navigate('/assessment')} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">Take New Assessment</button>
            {history.filter(a => a.status === 'completed').length > 0 && (
              <button onClick={() => downloadReport(history.filter(a => a.status === 'completed')[0].id).catch(() => {})}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
                📄 Download PDF Report
              </button>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Assessment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Version</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {history.map(a => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">{new Date(a.started_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{a.version_name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${a.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{a.status}</span>
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          {a.status === 'completed' && (
                            <>
                              <button onClick={() => navigate(`/results/${a.id}`)} className="px-3 py-1 text-xs font-medium text-indigo-600 border border-gray-200 rounded-lg hover:bg-indigo-50">View</button>
                              <button onClick={() => downloadReport(a.id).catch(() => {})} className="px-3 py-1 text-xs font-medium text-indigo-600 border border-gray-200 rounded-lg hover:bg-indigo-50">PDF</button>
                            </>
                          )}
                          {a.status === 'in_progress' && (
                            <button onClick={() => navigate(`/assessment/${a.id}`)} className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Continue</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
