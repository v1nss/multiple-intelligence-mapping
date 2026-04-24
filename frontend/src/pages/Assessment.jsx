import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment.js';
import { useAuth } from '../context/AuthContext.jsx';

const LIKERT_5_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const LIKERT_3_LABELS = ['Dislike it', 'Not Sure', 'Like it'];

function shuffleArray(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Assessment({ embedded = false }) {
  const { id: existingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [hasAssessmentHistory, setHasAssessmentHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(!existingId);
  const initRef = useRef(false);
  const questionnaireRef = useRef(null);

  const QUESTIONS_PER_PAGE = 5;

  // On landing: check if there's already an in-progress assessment
  useEffect(() => {
    if (existingId || initRef.current) return;
    initRef.current = true;

    setHistoryLoading(true);
    fetchHistory()
      .then(assessments => {
        const hasHistory = Array.isArray(assessments) && assessments.length > 0;
        setHasAssessmentHistory(hasHistory);
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
      const miQuestions = qs.filter(q => q.domain_type === 'MI');
      const riasecQuestions = qs.filter(q => q.domain_type === 'RIASEC');
      const otherQuestions = qs.filter(q => q.domain_type !== 'MI' && q.domain_type !== 'RIASEC');

      const randomizedQuestions = [
        ...shuffleArray(miQuestions),
        ...shuffleArray(riasecQuestions),
        ...otherQuestions,
      ];

      setQuestions(randomizedQuestions);
      const existing = {};
      randomizedQuestions.forEach(q => { if (q.current_answer) existing[q.id] = q.current_answer; });
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

  useEffect(() => {
    if (phase !== 'questions') return;

    const scrollTarget = questionnaireRef.current;

    // Wait for page content to render before scrolling.
    requestAnimationFrame(() => {
      if (scrollTarget && scrollTarget.scrollHeight > scrollTarget.clientHeight) {
        scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [currentPage, phase]);

  // ─── LANDING PAGE ──────────────────────────────────────────────
  if (phase === 'landing') {
    const outerClass = embedded
      ? 'w-full'
      : 'mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10';

    // New account, no assessments yet
    if (!existingId && !hasAssessmentHistory && !inProgressAssessment) {
      // Dashboard (embedded): original “Discover Your Hidden Potential” onboarding card
      if (embedded) {
        return (
          <div className={`${outerClass} space-y-6`}>
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-gray-500">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                <p>Loading...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                  <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[40px]">
                    Welcome to the MIM System,{' '}
                    <span className="text-blue-600">{user?.first_name || 'Student'}!</span>
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 sm:text-base">
                    {"You don't have any records yet. Start your first assessment below."}
                  </p>
                </div>

                <div className="mx-auto w-full max-w-6xl rounded-2xl border border-gray-200 bg-white px-5 py-8 shadow-xl shadow-gray-300/35 sm:px-8 sm:py-10">
                  <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                      <svg className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5a2.5 2.5 0 00-2.5 2.5v.6A3.4 3.4 0 003 10.9 3.1 3.1 0 006.1 14h.1m3.3-9.5A2.5 2.5 0 0112 2a2.5 2.5 0 012.5 2.5v.6a3.4 3.4 0 013.5 3.3A3.1 3.1 0 0114.9 14h-.1M12 22v-7m0 0a3 3 0 00-3-3m3 3a3 3 0 013-3m-3 0V9" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Discover Your Hidden Potential</h2>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                      Discover your dominant intelligences and get AI-powered recommendations for your Senior High School strand and future career path.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartNew}
                      disabled={starting}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {starting ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          Start Assessment
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                    </button>
                    <div className="mt-10 grid w-full grid-cols-1 gap-4 text-center sm:grid-cols-3">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">✦</div>
                        <p className="text-xs font-medium text-gray-500">AI Analysis</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">⤴</div>
                        <p className="text-xs font-medium text-gray-500">Strand Recommendations</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-500">▣</div>
                        <p className="text-xs font-medium text-gray-500">Career Pathways</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {(error || submitError) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || submitError}</div>
            )}
          </div>
        );
      }

      // Full /assessment page: same chrome as Results overview empty state
      return (
        <div className={`${outerClass} space-y-6`}>
          <header>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
            <p className="mt-1 text-sm text-gray-400">All your completed assessment outputs in one place.</p>
          </header>

          {historyLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p>Loading completed results...</p>
            </div>
          )}

          {!historyLoading && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mb-3 text-4xl">📋</div>
              <h2 className="text-xl font-bold text-gray-900">No completed results yet</h2>
              <p className="mt-1 text-sm text-gray-500">Finish an assessment to see your results here.</p>
              <button
                type="button"
                onClick={handleStartNew}
                disabled={starting}
                className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {starting ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Take Assessment'
                )}
              </button>
            </div>
          )}

          {(error || submitError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || submitError}</div>
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

    return (
      <div className={outerClass}>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[40px]">
            Welcome back, <span className="text-blue-600">{user?.first_name || 'Student'}!</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            You already have assessment records. Start a new one or continue where you left off.
          </p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-gray-200 bg-white px-5 py-8 shadow-xl shadow-gray-300/35 sm:mt-10 sm:px-8 sm:py-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <svg className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5a2.5 2.5 0 00-2.5 2.5v.6A3.4 3.4 0 003 10.9 3.1 3.1 0 006.1 14h.1m3.3-9.5A2.5 2.5 0 0112 2a2.5 2.5 0 012.5 2.5v.6a3.4 3.4 0 013.5 3.3A3.1 3.1 0 0114.9 14h-.1M12 22v-7m0 0a3 3 0 00-3-3m3 3a3 3 0 013-3m-3 0V9" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Discover Your Hidden Potential</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
              Discover your dominant intelligences and get AI-powered recommendations for your Senior High School strand and future career path.
            </p>

            {!inProgressAssessment ? (
              <button
                onClick={handleStartNew}
                disabled={starting || historyLoading}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {starting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Assessment
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleContinue(inProgressAssessment.id)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
              >
                Continue Assessment
                <span aria-hidden="true">→</span>
              </button>
            )}

            <div className="mt-10 grid w-full grid-cols-1 gap-4 text-center sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">✦</div>
                <p className="text-xs font-medium text-gray-500">AI Analysis</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">⤴</div>
                <p className="text-xs font-medium text-gray-500">Strand Recommendations</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-500">▣</div>
                <p className="text-xs font-medium text-gray-500">Career Pathways</p>
              </div>
            </div>
          </div>
        </div>

        {/* Errors */}
        {(error || submitError) && (
          <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || submitError}</div>
        )}

        {historyLoading && (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        )}

        {!embedded && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── QUESTIONS PAGE ────────────────────────────────────────────
  if (loading && questions.length === 0) {
    return (
      <div className={`mx-auto flex max-w-4xl flex-col items-center gap-4 py-16 text-gray-500 ${embedded ? '' : 'px-4 sm:px-6'}`}>
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p>Loading assessment...</p>
      </div>
    );
  }

  return (
    <div
      ref={questionnaireRef}
      className={`mx-auto max-w-4xl space-y-6 md:space-y-8 md:py-10 pb-16 ${embedded ? 'py-4' : 'px-4 py-8 sm:px-6'}`}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MIPQ III + RIASEC Assessment</h1>
        <p className="mt-1 text-sm text-gray-500">Answer each item using the scale shown below each question.</p>
      </div>

      {(error || submitError) && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || submitError}</div>}

      {/* Progress */}
      <div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-linear-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{answeredCount} / {questions.length} answered</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {currentQuestions.map((q, idx) => {
          const maxVal = q.max_value || (q.domain_type === 'RIASEC' ? 3 : 5);
          const labels = maxVal === 3 ? LIKERT_3_LABELS : LIKERT_5_LABELS;
          const scaleValues = Array.from({ length: maxVal }, (_, i) => i + 1);

          return (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Question {currentPage * QUESTIONS_PER_PAGE + idx + 1}
                </span>
              </div>
              <p className="text-base font-medium text-gray-900 mb-4 leading-relaxed">{q.question_text}</p>
              <div className="flex gap-2 flex-wrap">
                {scaleValues.map(value => (
                  <label key={value}
                    className={`flex-1 min-w-17.5 flex flex-col items-center gap-1 py-3 px-2 border-2 rounded-lg cursor-pointer transition-all text-center
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
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
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
