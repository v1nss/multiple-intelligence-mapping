import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment.js';

export default function ResultsOverview() {
  const navigate = useNavigate();
  const { fetchHistory, history, loading, error, downloadReport } = useAssessment();

  useEffect(() => {
    fetchHistory().catch(() => {});
  }, []);

  const completedResults = history.filter((assessment) => assessment.status === 'completed');

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 md:py-10 pb-12">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
        <p className="mt-1 text-sm text-gray-400">All your completed assessment outputs in one place.</p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p>Loading completed results...</p>
        </div>
      )}

      {!loading && completedResults.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-3 text-4xl">📋</div>
          <h2 className="text-xl font-bold text-gray-900">No completed results yet</h2>
          <p className="mt-1 text-sm text-gray-500">Finish an assessment to see your results here.</p>
          <Link
            to="/assessment"
            className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Take Assessment
          </Link>
        </div>
      )}

      {!loading && completedResults.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Top MI</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Top Strand</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {completedResults.map((assessment) => (
                <tr key={assessment.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-700">
                    {assessment.completed_at
                      ? new Date(assessment.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{assessment.top_mi || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{assessment.top_strand || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                      Completed
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/results/${assessment.id}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => downloadReport(assessment.id).catch(() => {})}
                        className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
