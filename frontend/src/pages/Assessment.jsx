import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment.js';

const LIKERT_5_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const LIKERT_3_LABELS = ['Dislike it', 'Not Sure', 'Like it'];

export default function Assessment() {
  const { id: existingId } = useParams();
  const navigate = useNavigate();
  const { startAssessment, fetchQuestions, submitAssessment, loading, error } = useAssessment();

  const [assessmentId, setAssessmentId] = useState(existingId || null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const QUESTIONS_PER_PAGE = 5;

  useEffect(() => { initAssessment(); }, []);

  const initAssessment = async () => {
    try {
      let aId = existingId;
      if (!aId) {
        const result = await startAssessment();
        aId = result.id;
      }
      setAssessmentId(aId);
      const qs = await fetchQuestions(aId);
      setQuestions(qs);
      const existing = {};
      qs.forEach(q => { if (q.current_answer) existing[q.id] = q.current_answer; });
      setAnswers(existing);
    } catch (err) { console.error('Failed to init assessment:', err); }
  };

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const currentQuestions = questions.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE);
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const canGoNext = currentQuestions.every(q => answers[q.id] !== undefined);
  const isLastPage = currentPage === totalPages - 1;
  const allAnswered = answeredCount === questions.length;

  const handleAnswer = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleSubmit = async () => {
    if (!allAnswered) { setSubmitError('Please answer all questions before submitting.'); return; }
    setSubmitting(true); setSubmitError('');
    try {
      const responses = Object.entries(answers).map(([question_id, value]) => ({ question_id: parseInt(question_id), value }));
      await submitAssessment(assessmentId, responses);
      navigate(`/results/${assessmentId}`);
    } catch (err) { setSubmitError(err.response?.data?.error || 'Failed to submit assessment'); }
    finally { setSubmitting(false); }
  };

  // Detect which section we're in for the page header
  const currentSectionType = currentQuestions.length > 0 ? currentQuestions[0].domain_type : null;
  const isMixedPage = currentQuestions.some(q => q.domain_type !== currentSectionType);

  if (loading && questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-gray-500">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p>Loading assessment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MIPQ III + RIASEC Assessment</h1>
        <p className="text-gray-500 text-sm mt-1">Part 1: Multiple Intelligences (1-5 scale) • Part 2: Career Interests (1-3 scale)</p>
      </div>

      {(error || submitError) && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">{error || submitError}</div>}

      {/* Progress */}
      <div className="mb-8">
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{answeredCount} / {questions.length} answered</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Section indicator */}
      {!isMixedPage && currentQuestions.length > 0 && (
        <div className={`mb-6 px-4 py-3 rounded-lg border text-sm font-medium ${
          currentSectionType === 'MI'
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
            : 'bg-cyan-50 border-cyan-200 text-cyan-700'
        }`}>
          {currentSectionType === 'MI'
            ? '📋 Part 1 — Multiple Intelligences (MIPQ III) — Rate 1 (Strongly Disagree) to 5 (Strongly Agree)'
            : '🎯 Part 2 — Career Interests (RIASEC) — Rate 1 (Dislike it) to 3 (Like it)'}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-5 mb-8">
        {currentQuestions.map((q, idx) => {
          const maxVal = q.max_value || (q.domain_type === 'RIASEC' ? 3 : 5);
          const labels = maxVal === 3 ? LIKERT_3_LABELS : LIKERT_5_LABELS;
          const scaleValues = Array.from({ length: maxVal }, (_, i) => i + 1);

          return (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Question {currentPage * QUESTIONS_PER_PAGE + idx + 1}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  q.domain_type === 'MI'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-cyan-600 bg-cyan-50'
                }`}>
                  {q.domain_name} ({q.domain_type})
                </span>
              </div>
              <p className="text-base font-medium text-gray-900 mb-4 leading-relaxed">{q.question_text}</p>
              <div className="flex gap-2 flex-wrap">
                {scaleValues.map(value => (
                  <label key={value}
                    className={`flex-1 min-w-[70px] flex flex-col items-center gap-1 py-3 px-2 border-2 rounded-lg cursor-pointer transition-all text-center
                      ${answers[q.id] === value
                        ? (q.domain_type === 'MI' ? 'border-indigo-600 bg-indigo-50' : 'border-cyan-600 bg-cyan-50')
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <input type="radio" name={`q-${q.id}`} value={value}
                      checked={answers[q.id] === value}
                      onChange={() => handleAnswer(q.id, value)}
                      className="hidden" />
                    <span className={`text-lg font-bold ${
                      q.domain_type === 'MI' ? 'text-indigo-600' : 'text-cyan-600'
                    }`}>{value}</span>
                    <span className="text-[10px] text-gray-400 leading-tight hidden sm:block">{labels[value - 1]}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
          className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition">
          ← Previous
        </button>
        <span className="text-sm text-gray-400 font-medium">Page {currentPage + 1} of {totalPages}</span>
        {!isLastPage ? (
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={!canGoNext}
            className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!allAnswered || submitting}
            className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            {submitting ? 'Submitting...' : '✓ Submit Assessment'}
          </button>
        )}
      </div>
    </div>
  );
}
