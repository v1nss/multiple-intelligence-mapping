import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment.js';
import RadarChartComponent from '../components/RadarChartComponent.jsx';
import BarChartComponent from '../components/BarChartComponent.jsx';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchResult, downloadReport, loading, error } = useAssessment();
  const [result, setResult] = useState(null);

  useEffect(() => { if (id) fetchResult(id).then(data => setResult(data)).catch(() => {}); }, [id]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-gray-500">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p>Loading results...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      <button onClick={() => navigate('/dashboard')} className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg">Back to Dashboard</button>
    </div>
  );

  if (!result) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
        <p className="text-gray-500 mt-1">{result.student?.first_name} {result.student?.last_name} — Completed {result.assessment?.completed_at && new Date(result.assessment.completed_at).toLocaleDateString()}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 text-center shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Dominant Intelligence</div>
          <div className="text-xl font-bold text-gray-900">{result.mi_scores?.[0]?.domain}</div>
          <div className="text-sm text-gray-500 mt-1">{result.mi_scores?.[0] && `${(result.mi_scores[0].normalized_score * 100).toFixed(1)}%`}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">RIASEC Code</div>
          <div className="text-xl font-bold text-gray-900">{result.riasec_scores?.slice(0, 3).map(r => r.domain[0]).join('')}</div>
          <div className="text-sm text-gray-500 mt-1">Top: {result.riasec_scores?.[0]?.domain}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Best Strand</div>
          <div className="text-xl font-bold text-gray-900">{result.strand_ranking?.[0]?.strand}</div>
          <div className="text-sm text-gray-500 mt-1">{result.strand_ranking?.[0] && `${(result.strand_ranking[0].score * 100).toFixed(1)}%`}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <RadarChartComponent data={result.mi_scores} title="Multiple Intelligences" color="#4F46E5" />
        <RadarChartComponent data={result.riasec_scores} title="RIASEC Profile" color="#0891B2" />
      </div>

      <div className="mb-8">
        <BarChartComponent data={result.strand_ranking.map(s => ({ name: s.strand, score: s.score }))} title="SHS Strand Ranking" />
      </div>

      {/* MI Scores Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">MI Scores (Detailed)</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b-2 border-gray-200"><th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Intelligence</th><th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Raw Score</th><th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Normalized</th></tr></thead>
          <tbody>{result.mi_scores?.map(s => (<tr key={s.domain_id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2.5 px-3">{s.domain}</td><td className="py-2.5 px-3">{s.raw_score}</td><td className="py-2.5 px-3">{(s.normalized_score * 100).toFixed(1)}%</td></tr>))}</tbody>
        </table>
      </div>

      {/* RIASEC Scores Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">RIASEC Scores (Detailed)</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b-2 border-gray-200"><th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Type</th><th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Raw Score</th><th className="text-left py-2 px-3 text-xs font-semibold uppercase text-gray-400">Normalized</th></tr></thead>
          <tbody>{result.riasec_scores?.map(s => (<tr key={s.domain_id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2.5 px-3">{s.domain}</td><td className="py-2.5 px-3">{s.raw_score}</td><td className="py-2.5 px-3">{(s.normalized_score * 100).toFixed(1)}%</td></tr>))}</tbody>
        </table>
      </div>

      {/* Career List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Career Recommendations</h3>
        <div className="divide-y divide-gray-100">
          {result.career_suggestions?.map((c, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <span className="text-sm font-bold text-indigo-600 w-9">#{i + 1}</span>
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-900">{c.career}</div><div className="text-xs text-gray-400 truncate">{c.description}</div></div>
              <span className="text-sm font-bold text-green-600">{(c.score * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">← Back to Dashboard</button>
        <button onClick={() => downloadReport(id).catch(() => {})} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">📄 Download PDF Report</button>
      </div>
    </div>
  );
}
