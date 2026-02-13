import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment.js';

const LIKERT_5_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const LIKERT_3_LABELS = ['Dislike it', 'Not Sure', 'Like it'];

export default function Assessment() {
  const { id: existingId } = useParams();
  const navigate = useNavigate();
  const { startAssessment, fetchQuestions, submitAssessment, fetchHistory, loading, error } = useAssessment();

  // Phase: 'landing' (show start button) or 'questions' (show quiz)
  const [phase, setPhase] = useState(existingId ? 'questions' : 'landing');
  const [assessmentId, setAssessmentId] = useState(existingId || null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [starting, setStarting] = useState(false);
  const [inProgressAssessment, setInProgressAssessment] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(!existingId);
  const initRef = useRef(false);

  const QUESTIONS_PER_PAGE = 5;

  // On landing: check if there's already an in-progress assessment
  useEffect(() => {
    if (existingId || initRef.current) return;
    initRef.current = true;

    setHistoryLoading(true);
    fetchHistory()
      .then(assessments => {
        const inProgress = assessments?.find(a => a.status === 'in_progress');
        if (inProgress) {
          setInProgressAssessment(inProgress);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [existingId, fetchHistory]);

  // When we have an assessmentId and are in questions phase, load questions
  useEffect(() => {
    if (phase === 'questions' && assessmentId && questions.length === 0) {
      loadQuestions(assessmentId);
    }
  }, [phase, assessmentId]);

  const loadQuestions = async (aId) => {
    try {
      const qs = await fetchQuestions(aId);
      setQuestions(qs);
      const existing = {};
      qs.forEach(q => { if (q.current_answer) existing[q.id] = q.current_answer; });
      setAnswers(existing);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const handleStartNew = async () => {
    setStarting(true);
    setSubmitError('');
    try {
      const result = await startAssessment();
      const aId = result.id;
      setAssessmentId(aId);
      setPhase('questions');
    } catch (err) {
      // If there's already an in-progress assessment, offer to continue it
      if (err.response?.data?.assessment_id) {
        setInProgressAssessment({ id: err.response.data.assessment_id });
        setSubmitError('You already have an in-progress assessment. Continue it or complete it first.');
      } else {
        setSubmitError(err.response?.data?.error || 'Failed to start assessment');
      }
    } finally {
      setStarting(false);
    }
  };

  const handleContinue = (aId) => {
    setAssessmentId(aId);
    setPhase('questions');
  };

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const currentQuestions = questions.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE);
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const canGoNext = currentQuestions.every(q => answers[q.id] !== undefined);
  const isLastPage = currentPage === totalPages - 1;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

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

  // ─── LANDING PAGE ──────────────────────────────────────────────
  if (phase === 'landing') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl mb-5 shadow-lg">
            📋
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">MIPQ III + RIASEC Assessment</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Discover your unique intelligence profile and career interests through this comprehensive assessment.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl">🧠</div>
              <h3 className="font-semibold text-gray-900">Part 1 — Multiple Intelligences</h3>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              90 questions covering 9 intelligence domains based on Howard Gardner's theory.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
              <span className="px-2 py-0.5 bg-indigo-50 rounded-full">1-5 Likert Scale</span>
              <span className="px-2 py-0.5 bg-indigo-50 rounded-full">9 Domains</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-xl">🎯</div>
              <h3 className="font-semibold text-gray-900">Part 2 — Career Interests</h3>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              60 questions exploring your career interests using the RIASEC model (Holland Code).
            </p>
            <div className="flex items-center gap-2 text-xs text-cyan-600 font-medium">
              <span className="px-2 py-0.5 bg-cyan-50 rounded-full">1-3 Likert Scale</span>
              <span className="px-2 py-0.5 bg-cyan-50 rounded-full">6 Types</span>
            </div>
          </div>
        </div>

        {/* What You'll Get */}
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">What you'll receive after completion:</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '📊', text: 'Your MI intelligence profile with scores' },
              { icon: '🧭', text: 'RIASEC career interest type' },
              { icon: '🎓', text: 'Recommended SHS strand' },
              { icon: '💼', text: 'Top career pathway matches' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                <span className="text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Estimate */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Estimated time: <strong className="text-gray-600">2-5 minutes</strong> • 71 total questions</span>
        </div>

        {/* Errors */}
        {(error || submitError) && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">{error || submitError}</div>
        )}

        {/* Continue In-Progress */}
        {historyLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : inProgressAssessment ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-xl">⏳</div>
              <div>
                <h3 className="font-semibold text-gray-900">You have an assessment in progress</h3>
                <p className="text-sm text-gray-500">Continue where you left off, or complete it before starting a new one.</p>
              </div>
            </div>
            <button
              onClick={() => handleContinue(inProgressAssessment.id)}
              className="w-full py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition shadow-md text-base"
            >
              ▶ Continue Assessment
            </button>
          </div>
        ) : null}

        {/* Start Button */}
        {!inProgressAssessment && (
          <button
            onClick={handleStartNew}
            disabled={starting || historyLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Starting...
              </span>
            ) : (
              '🚀 Start Assessment'
            )}
          </button>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          You can only have one assessment in progress at a time. Your answers are saved when you submit.
        </p>
      </div>
    );
  }

  // ─── QUESTIONS PAGE ────────────────────────────────────────────
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
