import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles, ArrowLeft, ArrowRight, X, Moon, Building2, ListChecks,
  ClipboardCheck, Calculator, FileSignature, Search, FileText, Rocket,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { assetUrl } from '../utils/assetUrl';

import dixLogo from '../assets/dix-logo.png';
import darkModeVideo from '../assets/tour/dark-mode-animation.mp4';
import setupVideo from '../assets/tour/new-entry-setup-screen.mp4';
import progressVideo from '../assets/tour/new-entry-progress-bar.mp4';
import testingVideo from '../assets/tour/testing-compliance-screen.mp4';
import deductionsVideo from '../assets/tour/deductions-screen.mp4';
import reviewVideo from '../assets/tour/review-documents-screen.mp4';
import searchVideo from '../assets/tour/search-records-driver-summary.mp4';
import quickFormsVideo from '../assets/tour/quick-forms-screen.mp4';

const TOUR_VERSION = 'v1';
const STORAGE_KEY = `dix_tour_seen_${TOUR_VERSION}`;

type Page = {
  icon: React.ElementType;
  accent: string;
  iconBg: string;
  title: string;
  subtitle: string;
  bullets: string[];
  video?: string;
};

const PAGES: Page[] = [
  {
    icon: Sparkles,
    accent: 'from-[#2563EB] via-[#3B82F6] to-[#60A5FA]',
    iconBg: 'bg-[#2563EB]',
    title: 'A fresh new DIX',
    subtitle: 'Same tools you know — rebuilt to be faster, cleaner, and easier to use',
    bullets: [
      'Everything that worked before, redesigned for speed and clarity',
      'Noticeably quicker on every screen — less waiting, more doing',
      'Take a minute to see what\'s new',
    ],
  },
  {
    icon: Moon,
    accent: 'from-slate-600 via-slate-800 to-slate-950',
    iconBg: 'bg-slate-800',
    title: 'Light & Dark mode',
    subtitle: 'Pick the look that\'s easiest on your eyes',
    bullets: [
      'Switch themes anytime with one click, top-right corner',
      'Your preference is remembered the next time you sign in',
      'The whole app adapts — not just the menus',
    ],
    video: darkModeVideo,
  },
  {
    icon: Building2,
    accent: 'from-sky-400 via-sky-500 to-blue-700',
    iconBg: 'bg-sky-500',
    title: 'Start a driver in seconds',
    subtitle: 'A cleaner setup screen that puts the important choices first',
    bullets: [
      'Pick a terminal, action, and contract type — no hunting for fields',
      'Inputs are larger and easier to click or tap',
      'Smart validation catches mistakes before you move on',
    ],
    video: setupVideo,
  },
  {
    icon: ListChecks,
    accent: 'from-indigo-400 via-indigo-600 to-indigo-900',
    iconBg: 'bg-indigo-500',
    title: 'Never lose your work',
    subtitle: 'The new wizard saves automatically as you go',
    bullets: [
      'Every step saves on its own — no big "Submit" at the end',
      'Close the app mid-entry and pick up right where you left off',
      'Clear progress bar so you always know where you are',
    ],
    video: progressVideo,
  },
  {
    icon: ClipboardCheck,
    accent: 'from-amber-400 via-orange-500 to-red-600',
    iconBg: 'bg-amber-500',
    title: 'Tests, sent the moment you\'re ready',
    subtitle: 'ELP, Hazmat, and Homeland emails go out automatically',
    bullets: [
      'Status badges update live — Sent, Passed, Failed — no guesswork',
      'Hazmat terminals trigger both tests at once',
      'Much faster feedback than the old email-and-wait routine',
    ],
    video: testingVideo,
  },
  {
    icon: Calculator,
    accent: 'from-emerald-400 via-teal-500 to-cyan-700',
    iconBg: 'bg-emerald-500',
    title: 'See the numbers as you choose',
    subtitle: 'The cost summary recalculates instantly on every toggle',
    bullets: [
      'Weekly, monthly, and one-time charges right on the side',
      'No more mental math or spreadsheets',
      'Values always match the terminal you selected',
    ],
    video: deductionsVideo,
  },
  {
    icon: FileSignature,
    accent: 'from-violet-400 via-purple-600 to-fuchsia-700',
    iconBg: 'bg-violet-500',
    title: 'Documents in under a second',
    subtitle: 'Most PDFs now download instantly — no more spinner spinning',
    bullets: [
      'What used to take 20–30 seconds now takes less than one',
      'Every form pre-fills driver info automatically',
      'Organized sections: Start-up, Recruiting, Equipment, Ports & Rails, Orientation',
    ],
    video: reviewVideo,
  },
  {
    icon: Search,
    accent: 'from-rose-400 via-pink-500 to-red-600',
    iconBg: 'bg-rose-500',
    title: 'Find any driver, fast',
    subtitle: 'A faster, cleaner Search screen with a full summary at a glance',
    bullets: [
      'Tap a row to see every detail in one sleek view',
      'One-click to edit, jump to documents, or delete',
      'Search and sort feel instant — no lag',
    ],
    video: searchVideo,
  },
  {
    icon: FileText,
    accent: 'from-cyan-400 via-sky-500 to-blue-700',
    iconBg: 'bg-cyan-500',
    title: 'Quick Forms, when you just need a form',
    subtitle: 'Stand-alone PDFs without having to create a driver record',
    bullets: [
      'Rider Permit, Intent of Lease, IRP Plate, Insurance Form',
      'Fill, preview, download — done in seconds',
      'Perfect for one-off requests from carriers or agents',
    ],
    video: quickFormsVideo,
  },
];

export default function WelcomeTour() {
  const [show, setShow] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [closing, setClosing] = useState(false);
  const [mediaKey, setMediaKey] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, page]);

  const goNext = () => {
    if (page >= PAGES.length - 1) return;
    setDirection('next');
    setPage((p) => p + 1);
    setMediaKey((k) => k + 1);
    setVideoError(null);
  };

  const goPrev = () => {
    if (page <= 0) return;
    setDirection('prev');
    setPage((p) => p - 1);
    setMediaKey((k) => k + 1);
    setVideoError(null);
  };

  const goTo = (target: number) => {
    if (target === page) return;
    setDirection(target > page ? 'next' : 'prev');
    setPage(target);
    setMediaKey((k) => k + 1);
    setVideoError(null);
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
      setPage(0);
    }, 220);
  };

  if (!show) return null;

  const p = PAGES[page];
  const Icon = p.icon;
  const isFirst = page === 0;
  const isLast = page === PAGES.length - 1;
  const slideAnim = direction === 'next' ? 'animate-tour-in-right' : 'animate-tour-in-left';

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-200',
        closing ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-xl transition-all duration-200',
          closing ? 'bg-black/0 backdrop-blur-0' : '',
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative w-full max-w-3xl bg-card border border-border/80 rounded-2xl shadow-[0_30px_70px_-12px_rgba(0,0,0,0.45)] dark:shadow-[0_30px_70px_-12px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-200',
          closing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up',
        )}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-lg bg-card/80 backdrop-blur-md border border-border text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground hover:scale-105 active:scale-95"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative h-[320px] overflow-hidden bg-gradient-to-br from-muted/40 to-muted/10">
          <div key={mediaKey} className="absolute inset-0 animate-tour-media-in">
            {p.video ? (
              <>
                <video
                  key={p.video}
                  src={assetUrl(p.video)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    v.play().catch(() => {});
                  }}
                  onError={(e) => {
                    const v = e.currentTarget;
                    const code = v.error?.code;
                    const msg = v.error?.message || 'unknown';
                    setVideoError(`Video failed to load (code ${code}): ${msg}. URL: ${v.currentSrc}`);
                  }}
                  className="w-full h-full object-cover"
                />
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 bg-red-500/10 text-xs text-red-700 dark:text-red-300 text-center">
                    {videoError}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center relative bg-[#0F1E3D]">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#2563EB]/30 rounded-full blur-3xl" />
                  <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#3B82F6]/20 rounded-full blur-3xl" />
                </div>
                <img src={assetUrl(dixLogo)} alt="DIX" className="relative z-10 max-h-32 w-auto -translate-y-8 animate-fade-in-up" />
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>

        <div className="relative px-8 pt-4 pb-7">
          <div key={`content-${page}`} className={cn('space-y-5', slideAnim)}>
            <div className="flex items-start gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg', p.iconBg)}>
                <Icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isFirst ? 'Welcome' : `${page} of ${PAGES.length - 1}`}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">{p.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{p.subtitle}</p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {p.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-foreground/90 leading-relaxed animate-fade-in-up"
                  style={{ animationDelay: `${120 + i * 80}ms` }}
                >
                  <span className={cn('mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0', p.iconBg)} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              {PAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300 ease-out',
                    i === page ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/40',
                  )}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={goPrev}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent hover:-translate-x-0.5 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              {isLast ? (
                <button
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-md shadow-primary/25 transition-all duration-200 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-95"
                >
                  <Rocket className="w-4 h-4" />
                  Get Started
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-md shadow-primary/25 transition-all duration-200 hover:translate-x-0.5 hover:shadow-lg hover:shadow-primary/40 active:scale-95"
                >
                  {isFirst ? 'Take the Tour' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
