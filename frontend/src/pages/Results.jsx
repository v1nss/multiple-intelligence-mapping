import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment.js';
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

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchResult, downloadReport, loading, error } = useAssessment();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (id) fetchResult(id).then(data => setResult(data)).catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-gray-500">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p>Loading results...</p>
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
  const topPct = topMI ? Math.round(topMI.normalized_score * 100) : 0;
  const topStrand = result.strand_ranking?.[0];
  const topMINames = result.mi_scores?.slice(0, 2).map(s => MI_RADAR_SHORT[s.domain] || s.domain).join(' and ') || '';
  const learning = MI_LEARNING[topMI?.domain] || MI_LEARNING['Interpersonal'];

  // Radar data with short labels
  const radarData = (result.mi_scores || []).map(s => ({
    domain: MI_RADAR_SHORT[s.domain] || s.domain,
    score: Math.round(s.normalized_score * 100),
  }));

  // Sort MI scores for detailed breakdown (highest first)
  const miSorted = [...(result.mi_scores || [])].sort((a, b) => b.normalized_score - a.normalized_score);

  // Top 6 careers
  const topCareers = (result.career_suggestions || []).slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
        <div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-blue-600 transition mb-2 flex items-center gap-1">
            <span>‹</span> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Results</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Analysis conducted on {result.assessment?.completed_at
              ? new Date(result.assessment.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
              : '—'}
          </p>
        </div>
        <button
          onClick={() => downloadReport(id).catch(() => {})}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          TOP SECTION: Hero + Sidebar
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* LEFT 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Top Intelligence Hero ── */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 sm:p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-1/2 w-60 h-60 bg-white/5 rounded-full translate-y-1/2"></div>
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                Top Intelligence
              </span>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-2">{topMI?.domain || '—'}</h2>
                  <p className="text-white/80 text-sm leading-relaxed max-w-lg">
                    {MI_FULL_DESC[topMI?.domain] || ''}
                  </p>
                </div>
                <div className="shrink-0 bg-green-400 text-green-900 rounded-xl px-4 py-3 text-center shadow-lg">
                  <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">Score</div>
                  <div className="text-3xl font-black">{topPct}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Profile Balance + Learning Style ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Radar Chart - Profile Balance */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎯</span>
                <h3 className="text-base font-bold text-gray-900">Profile Balance</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} tickCount={5} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                  <Radar name="Score" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#4F46E5' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Learning Style */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💡</span>
                <h3 className="text-base font-bold text-gray-900">Your Learning Style</h3>
              </div>
              <div className="mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">How You Learn Best:</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{learning.how}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">Study Tips:</h4>
                <ul className="space-y-2">
                  {learning.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 1/3 SIDEBAR */}
        <div className="space-y-6">

          {/* ── Recommended Strand ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Strand</h3>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.476.884 6.042 2.346C13.524 18.884 15.669 18 18 18a8.987 8.987 0 013-.512V4.262A8.968 8.968 0 0018 3.75a8.967 8.967 0 00-6 2.292z" />
                </svg>
              </div>
            </div>
            <h4 className="text-2xl font-black text-gray-900">{topStrand?.strand || '—'}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{STRAND_FULL[topStrand?.strand] || ''}</p>

            <div className="mt-5 text-left border-t border-gray-100 pt-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">Why This Fits You</h5>
              <p className="text-xs text-gray-500 leading-relaxed">
                {topStrand && STRAND_WHY[topStrand.strand]
                  ? STRAND_WHY[topStrand.strand](topMINames)
                  : 'Your intelligence profile aligns well with this strand.'}
              </p>
            </div>
          </div>

          {/* ── Top Career Matches ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Career Matches</h3>
            <div className="space-y-4">
              {topCareers.map((c, i) => {
                const pct = Math.round(c.score * 100);
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${i === 0 ? 'bg-purple-600' : i === 1 ? 'bg-blue-600' : i === 2 ? 'bg-teal-600' : 'bg-gray-400'}`}>
                      {i === 0 ? '🎓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-gray-900 truncate">{c.career}</span>
                        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full shrink-0 ${matchBadge(pct)}`}>{pct}%</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{c.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DETAILED SCORE BREAKDOWN
          ═══════════════════════════════════════════ */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Detailed Score Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {miSorted.map((s) => {
            const pct = Math.round(s.normalized_score * 100);
            const level = scoreLevel(pct);
            const tags = MI_TAGS[s.domain] || [];
            const icon = MI_ICONS[s.domain] || '🧠';
            return (
              <div key={s.domain_id} className={`bg-white border ${level.border} rounded-xl p-5 shadow-sm hover:shadow transition`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${level.bg} flex items-center justify-center text-lg`}>{icon}</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{MI_SHORT[s.domain] || s.domain}</p>
                      <p className="text-[11px] text-gray-400">{MI_DESC[s.domain] || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{pct}%</span>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${level.text}`}>{level.label}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all duration-700 ${level.bar}`} style={{ width: `${pct}%` }} />
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
      </div>

      {/* ═══════════════════════════════════════════
          RIASEC SCORES (compact)
          ═══════════════════════════════════════════ */}
      {result.riasec_scores?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">RIASEC Interest Profile</h2>
          <p className="text-xs text-gray-400 mb-4">Your Holland Code: <span className="font-bold text-gray-700">{result.riasec_scores.slice(0, 3).map(r => r.domain[0]).join('')}</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {result.riasec_scores.map((s, i) => {
              const pct = Math.round(s.normalized_score * 100);
              const isTop = i < 3;
              return (
                <div key={s.domain_id} className={`rounded-xl p-4 text-center ${isTop ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className={`text-2xl font-black ${isTop ? 'text-blue-600' : 'text-gray-400'}`}>{s.domain[0]}</div>
                  <p className="text-xs font-semibold text-gray-700 mt-1">{s.domain}</p>
                  <p className={`text-sm font-bold mt-1 ${isTop ? 'text-blue-600' : 'text-gray-500'}`}>{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STRAND RANKING
          ═══════════════════════════════════════════ */}
      {result.strand_ranking?.length > 0 && (
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
      )}
    </div>
  );
}
