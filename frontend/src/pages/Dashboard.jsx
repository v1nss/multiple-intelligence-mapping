import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAssessment } from '../hooks/useAssessment.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

/* ── Short-name mapping for MI domains ── */
const MI_SHORT = {
  'Linguistic': 'Verbal',
  'Logical-Mathematical': 'Logical',
  'Spatial': 'Visual',
  'Bodily-Kinesthetic': 'Bodily',
  'Musical': 'Musical',
  'Interpersonal': 'Interpersonal',
  'Intrapersonal': 'Intrapersonal',
  'Existential': 'Existential',
  'Naturalistic': 'Naturalist',
};

/* ── MI domain descriptor ── */
const MI_DESC = {
  'Linguistic': 'Word Smart',
  'Logical-Mathematical': 'Logic Smart',
  'Spatial': 'Picture Smart',
  'Bodily-Kinesthetic': 'Body Smart',
  'Musical': 'Music Smart',
  'Interpersonal': 'Social Smart',
  'Intrapersonal': 'Self Smart',
  'Existential': 'Life Smart',
  'Naturalistic': 'Nature Smart',
};

/* ── Strand short descriptions ── */
const STRAND_DESC = {
  'HUMSS': 'Humanities',
  'STEM': 'Science',
  'ABM': 'Business',
  'GAS': 'General',
  'TVL': 'Technical',
  'Sports': 'Athletics',
  'Arts and Design': 'Creative',
};

/* ── Color helpers ── */
const BAR_COLOR = '#3B82F6';

function strandBarColor(pct) {
  if (pct >= 70) return '#3B82F6';
  if (pct >= 40) return '#F59E0B';
  return '#EF4444';
}

function matchBadgeColor(pct) {
  if (pct >= 90) return 'bg-green-500';
  if (pct >= 80) return 'bg-blue-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-gray-400';
}

function splitCareerBreakdown(breakdown = []) {
  const riasec = breakdown
    .filter(item => item.type === 'RIASEC')
    .sort((a, b) => b.weight - a.weight);
  const mi = breakdown
    .filter(item => item.type === 'MI')
    .sort((a, b) => b.weight - a.weight);
  return { riasec, mi };
}

/* ── SVG icons for summary cards ── */
function BrainIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    </div>
  );
}
function ShieldIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    </div>
  );
}
function SparkIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>
  );
}
function ChartIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    </div>
  );
}

/* ── Strand rank icon ── */
function StrandRankIcon({ rank }) {
  const colors = ['bg-purple-600', 'bg-blue-600', 'bg-teal-600', 'bg-orange-500', 'bg-red-500'];
  const icons = ['🎓', '#2', '#3', '#4', '#5'];
  if (rank === 1) {
    return (
      <div className={`w-9 h-9 rounded-lg ${colors[0]} flex items-center justify-center text-white text-sm`}>
        🎓
      </div>
    );
  }
  return (
    <div className={`w-9 h-9 rounded-lg ${colors[Math.min(rank - 1, 4)]} flex items-center justify-center text-white text-sm font-bold`}>
      {icons[Math.min(rank - 1, 4)]}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchHistory, fetchResult, downloadReport, history, error } = useAssessment();
  const [latestResult, setLatestResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const completedHistory = history.filter(a => a.status === 'completed');

  useEffect(() => {
    fetchHistory().then(assessments => {
      const completed = assessments?.filter(a => a.status === 'completed');
      if (completed?.length > 0) {
        fetchResult(completed[0].id)
          .then(data => setLatestResult(data))
          .catch(() => {})
          .finally(() => setResultLoading(false));
      } else {
        setResultLoading(false);
      }
    }).catch(() => setResultLoading(false));
  }, []);
  /* ── Derived data from latest result ── */
  const dominantRiasec = latestResult?.riasec_scores?.[0];
  const dominantMI = latestResult?.mi_scores?.[0];
  const topStrand = latestResult?.strand_ranking?.[0];
  const totalCompleted = completedHistory.length;

  // Bar chart data (MI scores only)
  const miBarData = (latestResult?.mi_scores || []).map(s => ({
    name: MI_SHORT[s.domain] || s.domain,
    value: s.raw_score, // Math.round(s.normalized_score * 100)
  }));

  // Top 4 career suggestions
  const topCareers = (latestResult?.career_suggestions || []).slice(0, 4);
  const activeCareerBreakdown = splitCareerBreakdown(selectedCareer?.breakdown);

  // Top 5 strand ranking
  const topStrands = (latestResult?.strand_ranking || []).slice(0, 5);

  // Max strand score for relative percentage

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-10 md:space-y-10 pb-12">
      {/* ── Welcome Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Welcome back, {user?.first_name}!</h1>
          <p className="text-gray-400 mt-1 text-sm">Your personalized Multiple Intelligence dashboard overview.</p>
        </div>
        <button
          onClick={() => navigate('/assessment')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Take Assessment
        </button>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* ── Loading state ── */}
      {resultLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p>Loading your results...</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!resultLoading && !latestResult && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No assessments yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Take your first MIPQ III + RIASEC assessment to discover your intelligence profile.</p>
          <button onClick={() => navigate('/assessment')} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-lg shadow-lg shadow-blue-600/25">
            Start Assessment
          </button>
        </div>
      )}

      {!resultLoading && latestResult && (
        <div className="space-y-8 md:space-y-10">
          {/* ── 4 Summary Cards ── */}
          <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4 lg:gap-5">
            {/* Dominant Intelligence */}
            <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow sm:p-5">
              <BrainIcon />
              <p className="text-xs text-gray-400 font-medium mt-3 uppercase tracking-wider">Dominant Intelligence</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{dominantMI?.domain || '—'}</p>
              <p className="text-xs text-gray-400">{MI_DESC[dominantMI?.domain] || ''}</p>
            </div>

            {/* Overall MI Strength */}
            <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow sm:p-5">
              <SparkIcon />
              <p className="text-xs text-gray-400 font-medium mt-3 uppercase tracking-wider">Dominant Interest</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{dominantRiasec?.domain || '—'}</p>
              <p className="text-xs text-gray-400">RIASEC</p> {/*{MI_DESC[overallStrength?.domain] || ''} */}
            </div>

            {/* Top Recommendation */}
            <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow sm:p-5">
              <ShieldIcon />
              <p className="text-xs text-gray-400 font-medium mt-3 uppercase tracking-wider">Top Recommendation</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{topStrand?.strand || '—'}</p>
              <p className="text-xs text-gray-400">Recommended Strand</p>
            </div>

            {/* Total Completed */}
            <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow sm:p-5">
              <ChartIcon />
              <p className="text-xs text-gray-400 font-medium mt-3 uppercase tracking-wider">Total Completed</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{totalCompleted}</p>
              <p className="text-xs text-gray-400">Assessment{totalCompleted !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* ── Profile / Careers / Strand ── */}
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-6 lg:grid-cols-12 lg:gap-6">

            {/* Intelligence Profile - Bar Chart */}
            <div className="flex min-h-[300px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:min-h-0 lg:col-span-4">
              <div className="mb-3 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Intelligence Profile</h3>
                <p className="mt-1 text-xs text-gray-400">Visual representation of your strengths</p>
              </div>
              <div className="min-h-0 w-full min-w-0 flex-1">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={miBarData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis domain={[0, 'dataMax']} tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Raw score']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={22}>
                    {miBarData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Career Pathways */}
            <div className="flex min-h-[300px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:min-h-0 lg:col-span-4">
              <div className="mb-3 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Career Pathways</h3>
                <p className="mt-1 text-xs text-gray-400">Based on your {topStrand?.strand || ''} recommendation</p>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                {topCareers.map((c, i) => {
                  const pct = Math.round(c.score * 100);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedCareer(c)}
                      className="text-left border border-gray-100 rounded-xl p-3 hover:border-blue-200 hover:shadow-sm transition"
                    >
                      <span className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${matchBadgeColor(pct)}`}>
                        {pct}% Match
                      </span>
                      <p className="font-bold text-sm text-gray-900 mt-2 leading-tight">{c.career}</p>
                      <p className="text-[10px] text-gray-400 mt-1 truncate">{c.description}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">Click a career to view detail factors.</p>
              {/* {latestResult?.career_suggestions?.length > 4 && (
                <Link
                  to={`/results/${completedHistory[0]?.id}`}
                  className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 hover:text-blue-600 mt-4 transition"
                >
                  Explore All Careers <span>→</span>
                </Link>
              )} */}
            </div>

            {/* Top Strand */}
            <div className="flex min-h-[280px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:col-span-2 md:min-h-0 lg:col-span-4">
              <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Top Strand</h3>
                {completedHistory[0] && (
                  <Link to={`/results/${completedHistory[0].id}`} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 transition">
                    →
                  </Link>
                )}
              </div>
              <p className="mb-4 mt-1 text-xs text-gray-400">Your compatibility ranking</p>
              <div className="min-h-0 flex-1 space-y-4">
                {topStrands.map((s, i) => {
                  const displayPct = Math.round(s.score * 100);
                  const barWidthPct = Math.max(0, Math.min(displayPct, 100));
                  const barColor = strandBarColor(displayPct);
                  return (
                    <div key={s.strand_id} className="flex items-center gap-3">
                      <StrandRankIcon rank={i + 1} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <div>
                            <span className="text-sm font-bold text-gray-900">{s.strand}</span>
                            <span className="text-[10px] text-gray-400 ml-1.5">{STRAND_DESC[s.strand] || ''}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: barColor }}>{displayPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidthPct}%`, backgroundColor: barColor }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Recent Assessments ── */}
          {history.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Recent Assessments</h3>
                    <p className="text-xs text-gray-400">Track your progress over time</p>
                  </div>
                </div>
                {completedHistory.length > 3 && (
                  <button onClick={() => navigate('/results')} className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition">View All Results &gt;</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Top Result</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Recommendation</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 5).map(a => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-600">
                          {a.completed_at
                            ? new Date(a.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
                            : new Date(a.started_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {a.status === 'completed' ? (a.top_mi || '—') : '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {a.status === 'completed' ? (a.top_strand || '—') : (
                            <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full font-medium">In Progress</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {a.status === 'completed' ? (
                            <button onClick={() => navigate(`/results/${a.id}`)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition" title="View Results">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                          ) : (
                            <button onClick={() => navigate(`/assessment/${a.id}`)} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">Continue</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Export as PDF ── */}
          {completedHistory.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => downloadReport(completedHistory[0].id).catch(() => {})}
                className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export as PDF
              </button>
            </div>
          )}
        </div>
      )}

      {selectedCareer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close career details"
            onClick={() => setSelectedCareer(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCareer.career}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedCareer.description}</p>
                <p className="text-xs font-semibold text-indigo-600 mt-2">Match Score: {Math.round((selectedCareer.score || 0) * 100)}%</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCareer(null)}
                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">Top 3 RIASEC for this career</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeCareerBreakdown.riasec.slice(0, 3).map(item => (
                    <div key={item.domain_id} className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-bold text-blue-700">{item.domain}</p>
                      <p className="text-[11px] text-blue-700/90 mt-1">Weight: {(item.weight * 100).toFixed(0)}%</p>
                      <p className="text-[11px] text-blue-700/90">Your score: {(item.student_normalized_score * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">Related MI categories</h4>
                <div className="space-y-3">
                  {activeCareerBreakdown.mi.map(item => (
                    <div key={item.domain_id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{item.domain}</p>
                        <p className="text-xs font-semibold text-gray-700">Weight {(item.weight * 100).toFixed(0)}%</p>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.domain_description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
