import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment.js';
import { hasTopTwoStrandTie, hasTopTwoCareerTie } from '../utils/resultTies.js';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';

/* ═══════════════════════════════════════════════
   STATIC DATA MAPS
   ═══════════════════════════════════════════════ */

const MI_SHORT = {
  'Linguistic': 'Verbal-Linguistic',
  'Logical-Mathematical': 'Logical-Math',
  'Spatial': 'Visual-Spatial',
  'Bodily-Kinesthetic': 'Bodily-Kinesthetic',
  'Musical': 'Musical',
  'Interpersonal': 'Interpersonal',
  'Intrapersonal': 'Intrapersonal',
  'Existential': 'Existential',
  'Naturalistic': 'Naturalist',
};

const MI_RADAR_SHORT = {
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

const MI_FULL_DESC = {
  'Interpersonal': 'You have a natural ability to understand and interact effectively with others. You are skilled at managing relationships, empathizing with others, and understanding their motivations.',
  'Linguistic': 'You have a strong command of language and words. You excel at reading, writing, storytelling, and expressing complex ideas through verbal and written communication.',
  'Logical-Mathematical': 'You think conceptually and abstractly, and are able to see and explore patterns and relationships. You excel at reasoning, calculating, and solving complex problems.',
  'Spatial': 'You have a strong ability to think in three dimensions. You excel at visualizing objects, spatial reasoning, image manipulation, and artistic or graphic design.',
  'Bodily-Kinesthetic': 'You have excellent body awareness and motor control. You learn best through physical movement, hands-on activities, and direct manipulation of objects.',
  'Musical': 'You have a keen sensitivity to sounds, rhythms, and tones. You can easily recognize, create, and reproduce music and musical patterns.',
  'Intrapersonal': 'You have a deep understanding of yourself — your strengths, weaknesses, emotions, and motivations. You are reflective and enjoy working independently.',
  'Existential': 'You have a deep sensitivity and capacity to tackle fundamental questions about human existence, life, death, and the meaning of life.',
  'Naturalistic': 'You have a strong affinity for the natural world. You excel at recognizing and classifying plants, animals, and natural phenomena.',
};

const MI_LEARNING = {
  'Interpersonal': {
    how: 'You prefer learning through interaction and dialogue. Group activities, seminars, and collaborative projects are where you excel. You likely enjoy mentoring others.',
    tips: ['Study with a partner or in study groups.', 'Role-play concepts to understand them better.', 'Teach what you\'ve learned to someone else.'],
  },
  'Linguistic': {
    how: 'You learn best through reading, writing, and verbal discussions. You absorb information effectively through lectures, debates, and written materials.',
    tips: ['Take detailed notes and rewrite them.', 'Read widely on topics of interest.', 'Use storytelling to remember complex ideas.'],
  },
  'Logical-Mathematical': {
    how: 'You learn best through logical reasoning and systematic problem-solving. You enjoy experiments, puzzles, and finding patterns in data.',
    tips: ['Create charts and diagrams to organize information.', 'Solve practice problems and brain teasers.', 'Look for logical patterns and categorize data.'],
  },
  'Spatial': {
    how: 'You learn best through visual aids and spatial reasoning. You think in images and benefit from diagrams, maps, and visual representations.',
    tips: ['Use mind maps and visual diagrams.', 'Draw or sketch concepts to remember them.', 'Use color coding and visual organizers.'],
  },
  'Bodily-Kinesthetic': {
    how: 'You learn best through physical movement and hands-on activities. You need to touch, feel, and manipulate objects to truly understand concepts.',
    tips: ['Take frequent breaks and move around while studying.', 'Use physical models or manipulatives.', 'Practice skills through role-play or simulation.'],
  },
  'Musical': {
    how: 'You learn best through sound, rhythm, and music. You can remember information set to melodies and are sensitive to environmental sounds.',
    tips: ['Create songs or rhythms to remember key facts.', 'Study with background music that helps concentration.', 'Use rhythmic patterns to organize information.'],
  },
  'Intrapersonal': {
    how: 'You learn best through self-reflection and independent study. You thrive when given time alone to process information at your own pace.',
    tips: ['Keep a learning journal or diary.', 'Set personal goals and track your progress.', 'Find a quiet place to study independently.'],
  },
  'Existential': {
    how: 'You learn best when connecting topics to broader meaning and purpose. You are motivated by philosophical discussions and big-picture thinking.',
    tips: ['Connect lessons to real-world significance.', 'Explore the "why" behind what you study.', 'Engage in reflective writing about deeper meanings.'],
  },
  'Naturalistic': {
    how: 'You learn best in natural settings and through observation. You classify and categorize information instinctively and relate well to environmental topics.',
    tips: ['Study outdoors or in natural environments.', 'Classify and categorize information into groups.', 'Relate subjects to nature and real-world ecology.'],
  },
};

const MI_TAGS = {
  'Interpersonal': ['Effective Communicator', 'Empathetic', 'Team Player'],
  'Linguistic': ['Good Writer', 'Good Speaker', 'Persuasive'],
  'Logical-Mathematical': ['Analytical', 'Problem Solver', 'Abstract Thinker'],
  'Spatial': ['Good at Puzzles', 'Artistic', 'Visualizer'],
  'Bodily-Kinesthetic': ['Hands-on Learner', 'Athletic', 'Good Coordination'],
  'Musical': ['Musical', 'Rhythmic', 'Sensitive to Sound'],
  'Intrapersonal': ['Self-Reflective', 'Independent', 'Intuitive'],
  'Existential': ['Philosophical', 'Deep Thinker', 'Contemplative'],
  'Naturalistic': ['Outdoorsy', 'Observant', 'Animal Lover'],
};

const MI_ICONS = {
  'Interpersonal': '👥',
  'Linguistic': '📝',
  'Logical-Mathematical': '🧮',
  'Spatial': '🎨',
  'Bodily-Kinesthetic': '🏃',
  'Musical': '🎵',
  'Intrapersonal': '🧘',
  'Existential': '💭',
  'Naturalistic': '🌿',
};

const STRAND_FULL = {
  'HUMSS': 'Humanities & Social Sciences',
  'STEM': 'Science, Technology, Engineering & Mathematics',
  'ABM': 'Accountancy, Business & Management',
  'GAS': 'General Academic Strand',
  'TVL': 'Technical-Vocational-Livelihood',
  'Sports': 'Sports Track',
  'Arts and Design': 'Arts & Design Track',
};

const STRAND_WHY = {
  'HUMSS': (topMIs) => `The HUMSS strand focuses on understanding human behavior, culture, and society. Your strong ${topMIs} scores make you an ideal candidate for fields requiring strong communication and empathy.`,
  'STEM': (topMIs) => `The STEM strand emphasizes scientific inquiry, mathematical reasoning, and technological innovation. Your strong ${topMIs} scores make you well-suited for fields that require analytical thinking and problem-solving.`,
  'ABM': (topMIs) => `The ABM strand centers on business, finance, and management. Your strong ${topMIs} scores align well with careers requiring leadership, numerical analysis, and strategic planning.`,
  'GAS': (topMIs) => `The GAS strand provides a balanced academic foundation across multiple disciplines. Your ${topMIs} scores show versatility that benefits from a broad-based educational approach.`,
  'TVL': (topMIs) => `The TVL strand focuses on practical, hands-on skills and vocational training. Your strong ${topMIs} scores indicate natural aptitude for technical and practical work.`,
  'Sports': (topMIs) => `The Sports track emphasizes physical excellence, teamwork, and athletic development. Your strong ${topMIs} scores are ideal for careers in sports, coaching, and physical education.`,
  'Arts and Design': (topMIs) => `The Arts and Design track nurtures creativity, visual expression, and artistic skills. Your strong ${topMIs} scores make you a natural fit for creative and design-focused fields.`,
};

/* ── Card color schemes by score level ── */
function scoreLevel(pct) {
  if (pct >= 80) return { label: 'HIGH', border: 'border-purple-200', bg: 'bg-purple-50', bar: 'bg-purple-500', text: 'text-purple-600', tagBg: 'bg-purple-100', tagText: 'text-purple-700' };
  if (pct >= 50) return { label: 'MODERATE', border: 'border-blue-200', bg: 'bg-blue-50', bar: 'bg-blue-500', text: 'text-blue-600', tagBg: 'bg-blue-100', tagText: 'text-blue-700' };
  return { label: 'DEVELOPING', border: 'border-pink-200', bg: 'bg-pink-50', bar: 'bg-pink-500', text: 'text-pink-600', tagBg: 'bg-pink-100', tagText: 'text-pink-700' };
}

function matchBadge(pct) {
  if (pct >= 90) return 'bg-green-500';
  if (pct >= 85) return 'bg-blue-500';
  if (pct >= 80) return 'bg-indigo-500';
  return 'bg-gray-500';
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

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchResult, downloadReport, loading, error } = useAssessment();
  const [result, setResult] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [showAllCareers, setShowAllCareers] = useState(false);

  useEffect(() => {
    if (id) fetchResult(id).then(data => setResult(data)).catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-gray-500">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p>Loading results...</p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
      >
        Back to Dashboard
      </button>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      <button onClick={() => navigate('/dashboard')} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg">Back to Dashboard</button>
    </div>
  );

  if (!result) return null;

  /* ── Derived data ── */
  const topMI = result.mi_scores?.[0];
  const topStrand = result.strand_ranking?.[0];
  const topMINames = result.mi_scores?.slice(0, 2).map(s => MI_RADAR_SHORT[s.domain] || s.domain).join(' and ') || '';
  const learning = MI_LEARNING[topMI?.domain] || MI_LEARNING['Interpersonal'];

  // Radar data with short labels
  const radarData = (result.mi_scores || []).map(s => ({
    domain: MI_RADAR_SHORT[s.domain] || s.domain,
    score: parseFloat((s.normalized_score * 20).toFixed(2)),
  }));

  // Sort MI scores for detailed breakdown (highest first)
  const miSorted = [...(result.mi_scores || [])].sort((a, b) => b.normalized_score - a.normalized_score);

  // Top 5 careers for summary card + "See More" behavior
  const topCareers = (result.career_suggestions || []).slice(0, 5);
  const visibleCareers = showAllCareers ? topCareers : topCareers.slice(0, 3);
  const activeCareerBreakdown = splitCareerBreakdown(selectedCareer?.breakdown);

  const strandTie = result.tie_notes?.strand ?? hasTopTwoStrandTie(result.strand_ranking);
  const careerTie = result.tie_notes?.career ?? hasTopTwoCareerTie(result.career_suggestions);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 pb-14 sm:px-6 md:space-y-10 md:py-8 lg:px-8">

      {/* ── Header ── */}
      <header className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm ring-1 ring-slate-100/80 backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button onClick={() => navigate('/dashboard')} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
            <span>‹</span> Back to Dashboard
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Assessment Results</h1>
            <p className="mt-1 text-sm text-slate-500">
              Analysis conducted on {result.assessment?.completed_at
                ? new Date(result.assessment.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
                : '—'}
            </p>
          </div>
          <button
            onClick={() => downloadReport(id).catch(() => {})}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md sm:shrink-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF
          </button>
        </div>
      </header>

      {(strandTie || careerTie) && (
        <div
          className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 shadow-sm sm:px-5"
          role="status"
        >
          <p className="font-semibold text-amber-900">Even scores — ranking is not decisive</p>
          <p className="mt-1.5 leading-relaxed text-amber-900/90">
            {strandTie && careerTie && (
              <>Your top two strands and your top two career suggestions share the same rounded score, so this view cannot rank them in order. Explore both paths, talk with a teacher or counselor if it helps, and consider retaking on another day when you want a clearer spread.</>
            )}
            {strandTie && !careerTie && (
              <>Your first- and second-ranked strands share the same rounded score, so the order here is not decisive. Explore both strands, get guidance if helpful, and retaking on another day can give you a clearer pattern.</>
            )}
            {!strandTie && careerTie && (
              <>Your top two career suggestions share the same rounded score—use the list as a starting set rather than a strict order. Discuss options with someone you trust, and retaking on another day can help if you want more separation.</>
            )}
          </p>
          <button
            type="button"
            onClick={() => navigate('/assessment')}
            className="mt-3 inline-flex items-center rounded-lg bg-amber-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-900"
          >
            Retake on another day
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          HERO: Recommended Strand (full width)
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-300/35 bg-linear-to-br from-indigo-600 via-blue-600 to-violet-700 text-white shadow-xl shadow-indigo-900/20">
        <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-900/25 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-7 lg:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-7">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:pr-3">
              <div className="min-w-0 flex-1">
                <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/95 backdrop-blur-sm">
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.476.884 6.042 2.346C13.524 18.884 15.669 18 18 18a8.987 8.987 0 013-.512V4.262A8.968 8.968 0 0018 3.75a8.967 8.967 0 00-6 2.292z" />
                  </svg>
                  Recommended Strand
                </span>
                <h2 className="text-2xl font-black leading-none tracking-tight sm:text-[32px]">
                  {topStrand?.strand || '—'}
                </h2>
                <p className="mt-2 text-xs font-medium leading-tight text-white/80 sm:text-sm">{STRAND_FULL[topStrand?.strand] || ''}</p>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/90">
                  {topStrand && STRAND_WHY[topStrand.strand]
                    ? STRAND_WHY[topStrand.strand](topMINames)
                    : 'Your intelligence profile aligns well with this strand.'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/95">
                    Dominant MI: {topMI?.domain || '—'}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/95">
                    Total Careers: {topCareers.length}
                  </span>
                </div>
                {result.strand_ranking?.length > 1 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/15 pt-2.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Also Fits</span>
                    {result.strand_ranking.slice(1, 5).map((s, i) => (
                      <span
                        key={s.strand_id || i}
                        className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm transition hover:bg-white/20"
                      >
                        <span className="text-white/45">#{i + 2}</span>
                        <span>{s.strand}</span>
                        <span className="text-white/55">{Math.round((s.score || 0) * 100)}%</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {topStrand && (
              <div className="flex shrink-0 justify-center sm:self-center sm:justify-end sm:pl-2">
                <div className="flex aspect-square w-40 flex-col items-center justify-center rounded-3xl border border-white/25 bg-white/15 text-center shadow-md backdrop-blur-sm sm:w-48 lg:w-52">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">Match</div>
                  <div className="text-5xl font-black leading-none tabular-nums drop-shadow-sm sm:text-6xl lg:text-7xl">
                    {Math.round((topStrand.score || 0) * 100)}
                    <span className="text-2xl font-bold text-white/85">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          Balanced: Careers + Profile + Learning (equal cols on lg)
          ═══════════════════════════════════════════ */}
      <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        {/* Top Career Matches */}
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 lg:col-span-4">
          <div className="mb-4 flex shrink-0 items-center gap-2 border-b border-gray-100 pb-3">
            <span className="text-lg" aria-hidden>🎯</span>
            <h3 className="text-lg font-bold tracking-tight text-gray-900">Top Career Matches</h3>
          </div>
          <div className="space-y-2">
            {visibleCareers.map((c, i) => {
              const pct = Math.round(c.score * 100);
              const rank = showAllCareers ? i + 1 : i + 1;
              const isSelected = selectedCareer?.career === c.career;
              return (
                <button
                  key={`${c.career}-${i}`}
                  type="button"
                  onClick={() => setSelectedCareer(c)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition ${
                    isSelected
                      ? 'border-indigo-200 bg-indigo-50/70 shadow-sm'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${rank === 1 ? 'bg-purple-600' : rank === 2 ? 'bg-blue-600' : rank === 3 ? 'bg-teal-600' : 'bg-gray-400'}`}>
                    {rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{c.career}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${matchBadge(pct)}`}>{pct}%</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{c.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {topCareers.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllCareers(prev => !prev)}
              className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              {showAllCareers ? 'See Less' : `See More (${topCareers.length - 3})`}
              <span>{showAllCareers ? '↑' : '↓'}</span>
            </button>
          )}
          <p className="mt-3 shrink-0 text-[11px] text-slate-400">Tap a career to view detailed factors.</p>
        </div>

        {/* Radar */}
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 lg:col-span-4">
          <div className="mb-4 flex shrink-0 items-center gap-2 border-b border-gray-100 pb-3">
            <span className="text-lg" aria-hidden>📊</span>
            <h3 className="text-lg font-bold tracking-tight text-gray-900">Intelligence Balance</h3>
          </div>
          <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 9, fill: '#9CA3AF' }} tickCount={5} />
                <Tooltip formatter={(v) => [`${v}/20`, 'Score']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                <Radar name="Score (/20)" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#4F46E5' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Style */}
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 lg:col-span-4">
          <div className="mb-4 flex shrink-0 items-center gap-2 border-b border-gray-100 pb-3">
            <span className="text-lg" aria-hidden>💡</span>
            <h3 className="text-lg font-bold tracking-tight text-gray-900">Your Learning Style</h3>
          </div>
          <div className="mb-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-900">How You Learn Best</h4>
            <p className="text-sm leading-relaxed text-gray-500">{learning.how}</p>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-900">Study Tips</h4>
            <ul className="space-y-2">
              {learning.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          DETAILED SCORE BREAKDOWN
          ═══════════════════════════════════════════ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-1 border-b border-gray-100 pb-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Detailed Score Breakdown</h2>
          <p className="text-xs text-gray-400">Nine MI domains, sorted by strength</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {miSorted.map((s) => {
            const pct = Math.round(s.normalized_score * 100);
            const level = scoreLevel(pct);
            const tags = MI_TAGS[s.domain] || [];
            const icon = MI_ICONS[s.domain] || '🧠';
            const rawScore = Math.round(s.raw_score || 0);
            const totalScore = Math.round(s.total_possible_score || 0);
            return (
              <div key={s.domain_id} className={`rounded-2xl border p-5 transition hover:shadow-sm ${level.border} ${level.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${level.bg} flex items-center justify-center text-lg`}>{icon}</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{MI_SHORT[s.domain] || s.domain}</p>
                      <p className="text-[11px] text-gray-400">{MI_DESC[s.domain] || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{rawScore}/{totalScore}</span>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${level.text}`}>{level.label}</p>
                  </div>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${level.tagBg} ${level.tagText}`}>{tag}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          RIASEC SCORES (compact)
          ═══════════════════════════════════════════ */}
      {result.riasec_scores?.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-1 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">RIASEC Interest Profile</h2>
            <p className="text-xs text-gray-400">
              Holland code: <span className="font-bold text-gray-700">{result.riasec_scores.slice(0, 3).map(r => r.domain[0]).join('')}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {result.riasec_scores.map((s, i) => {
              const rawScore = Math.round(s.raw_score || 0);
              const totalScore = Math.round(s.total_possible_score || 0);
              const isTop = i < 3;
              return (
                <div key={s.domain_id} className={`rounded-xl border p-4 text-center transition ${isTop ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-gray-200 bg-gray-50'}`}>
                  <div className={`text-2xl font-black ${isTop ? 'text-blue-600' : 'text-gray-400'}`}>{s.domain[0]}</div>
                  <p className="mt-1 text-xs font-semibold text-gray-700">{s.domain}</p>
                  <p className={`mt-1 text-sm font-bold ${isTop ? 'text-blue-600' : 'text-gray-500'}`}>{rawScore}/{totalScore}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          STRAND RANKING
          ═══════════════════════════════════════════ */}
      {/* {result.strand_ranking?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">SHS Strand Compatibility</h2>
          <div className="space-y-3">
            {result.strand_ranking.map((s, i) => {
              const pct = Math.round(s.score * 100);
              const maxPct = Math.round(result.strand_ranking[0].score * 100);
              const relWidth = (pct / maxPct) * 100;
              const color = i === 0 ? 'bg-blue-500' : i < 3 ? 'bg-blue-400' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';
              return (
                <div key={s.strand_id} className="flex items-center gap-4">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-blue-600' : i < 3 ? 'bg-blue-500' : 'bg-gray-400'}`}>{i + 1}</span>
                  <span className="w-32 text-sm font-semibold text-gray-700 shrink-0">{s.strand}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${relWidth}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )} */}

      <div className="flex justify-center border-t border-slate-100 pt-8">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Optional improvement: render this modal through a portal for stricter stacking/isolation if global overlays grow. */}
      {selectedCareer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close career details"
            onClick={() => setSelectedCareer(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl">
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
                      <p className="text-[11px] text-blue-700/90">Contribution: {(item.contribution * 100).toFixed(1)}</p>
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
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-700">Weight {(item.weight * 100).toFixed(0)}%</p>
                          <p className="text-[11px] text-gray-500">
                            Score {Math.round(item.student_raw_score || 0)}/{Math.round(item.student_total_possible_score || 0)}
                          </p>
                        </div>
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
