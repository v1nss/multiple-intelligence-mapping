import { Link } from 'react-router-dom';

const FEATURES = [
  {
    label: 'AI Analysis',
    icon: '✧',
    iconClass: 'bg-fuchsia-100 text-fuchsia-500',
  },
  {
    label: 'Strand Recommendations',
    icon: '⌂',
    iconClass: 'bg-emerald-100 text-emerald-500',
  },
  {
    label: 'Career Pathways',
    icon: '▣',
    iconClass: 'bg-amber-100 text-amber-500',
  },
];

export default function UnifiedShowcaseCard({
  compact = false,
  showAction = true,
  actionTo = '/assessment',
  actionLabel = 'Start Assessment',
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
          <span className="text-2xl leading-none">🧠</span>
        </div>

        <h2 className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight text-slate-900`}>
          Discover Your Hidden Potential
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Discover your dominant intelligences and get AI-powered recommendations for your Senior High
          School strand and future career path.
        </p>

        {showAction && (
          <Link
            to={actionTo}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {actionLabel}
            <span aria-hidden>→</span>
          </Link>
        )}

        <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
          {FEATURES.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2.5 rounded-2xl px-2 py-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${item.iconClass}`}
                aria-hidden
              >
                {item.icon}
              </span>
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
