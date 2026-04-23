import { useLocation } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';

/**
 * Shared auth shell that stays mounted across /login <-> /register so that
 * the hero panel can smoothly slide between sides while the active form
 * cross-fades in. No remount, no layout jump, single hero instance.
 */
export default function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname.startsWith('/register');

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="w-full max-w-300 relative">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:min-h-165">
          {/* HERO — single instance, slides between sides on desktop */}
          <div
            aria-hidden
            className={[
              'order-1 lg:order-0',
              'lg:absolute lg:top-0 lg:left-0 lg:h-full lg:w-[calc(50%-1.5rem)] lg:z-0',
              'lg:will-change-transform',
              'lg:transition-transform lg:duration-700 lg:ease-[cubic-bezier(0.65,0,0.35,1)]',
              isRegister ? 'lg:translate-x-[calc(100%+3rem)]' : 'lg:translate-x-0',
            ].join(' ')}
          >
            <HeroCard />
          </div>

          {/* LEFT slot — Register form */}
          <FormSlot side="left" isActive={isRegister}>
            <Register />
          </FormSlot>

          {/* RIGHT slot — Login form */}
          <FormSlot side="right" isActive={!isRegister}>
            <Login />
          </FormSlot>
        </div>
      </div>
    </div>
  );
}

function FormSlot({ side, isActive, children }) {
  const colClass = side === 'left' ? 'lg:col-start-1' : 'lg:col-start-2';
  return (
    <div
      className={[
        'order-2 lg:order-0 relative z-10',
        colClass,
        'w-full max-w-md mx-auto lg:mx-0 lg:px-6',
        // Mobile: simple show/hide to avoid stacked empty space
        isActive ? 'block' : 'hidden lg:block',
        // Desktop: crossfade with staggered timing for a polished feel
        'lg:transition-opacity lg:ease-out',
        isActive
          ? 'lg:opacity-100 lg:duration-500 lg:delay-300 lg:pointer-events-auto'
          : 'lg:opacity-0 lg:duration-200 lg:delay-0 lg:pointer-events-none',
      ].join(' ')}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}

function HeroCard() {
  return (
    <div className="relative w-full aspect-5/6 sm:aspect-4/5 lg:aspect-auto lg:h-165 rounded-[28px] overflow-hidden shadow-xl ring-1 ring-blue-200/40">
      <img
        src="/Rectangle 205.png"
        alt="Graduation"
        className="absolute inset-0 w-full h-full object-cover scale-[1.03] blur-[1.2px] saturate-[0.72] brightness-[0.75] contrast-[0.92]"
      />
      <div className="absolute inset-0 bg-blue-300/35 mix-blend-multiply" />
      <div className="absolute inset-0 bg-linear-to-b from-blue-900/22 via-blue-900/38 to-blue-950/72" />
      <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(8,22,55,0.42)]" />

      <div className="relative h-full flex flex-col justify-end p-8 sm:p-10 lg:p-12 text-white">
        <div className="max-w-130">
          <p className="text-lg sm:text-xl font-medium leading-tight">Unlock potential with</p>
          <h2 className="mt-1 text-4xl sm:text-5xl lg:text-[60px] font-extrabold leading-[0.95] tracking-tight uppercase">
            Multiple
            <br />
            Intelligence
            <br />
            Mapping
          </h2>
          <p className="mt-5 text-sm sm:text-base text-white/85 leading-relaxed">
            An intelligent system that identifies and visualizes students&apos; strengths across multiple
            intelligences to support personalized learning.
          </p>
        </div>

        <div className="mt-6 border-t border-white/30" />

        <div className="mt-5 grid grid-cols-2 gap-6 max-w-md">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold">8 Types</p>
            <p className="mt-1 text-xs sm:text-sm text-white/80">Intelligence Domains Mapped</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold">Real-Time</p>
            <p className="mt-1 text-xs sm:text-sm text-white/80">Student Profiling &amp; Insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
