import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Department, Location, Role, User } from "@sos-procuresphere/shared";
import { AuthPortal } from "@/components/auth/AuthPortal";
import { HeroCarousel } from "@/components/marketing/HeroCarousel";
import { api, type SignupPayload } from "@/lib/api";

const heroStats = [
  { value: "96%", label: "policy adherence visibility" },
  { value: "1 click", label: "audit pack generation" },
  { value: "24 weeks", label: "delivery blueprint" },
  { value: "3-way", label: "invoice matching control" }
];

const capabilityCards = [
  {
    title: "Procure-to-pay automation",
    text: "Requisitions, RFx, approvals, POs, receiving, and invoice matching move through one policy-driven chain."
  },
  {
    title: "Linked document control",
    text: "OCR, metadata, retention rules, and document histories stay attached to each supplier and transaction."
  },
  {
    title: "Finance and banking workflow",
    text: "Budget checks, payment approvals, mock bank adapters, and reconciliation hooks support donor-grade controls."
  }
];

const highlightBullets = [
  "Threshold approvals and segregation-of-duties enforcement",
  "Multi-location governance for Monrovia, Buchanan, and Kakata operations",
  "Responsive PWA access for web, tablet, and mobile approval workflows"
];

export const LandingPage = ({
  users,
  locations,
  departments,
  sessionUser,
  loading,
  onLogin,
  onSignup
}: {
  users: Array<User & { roles: Role[] }>;
  locations: Location[];
  departments: Department[];
  sessionUser?: User | null;
  loading?: boolean;
  onLogin: (email: string) => Promise<void>;
  onSignup: (payload: SignupPayload) => Promise<void>;
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");

  const openAuthModal = (tab: "signin" | "signup" = "signin") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuthModal();
      }
    };
    if (isAuthModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen]);

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(145deg,_#061120_0%,_#0b1e33_40%,_#0e2740_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_26%),_radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_18%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.035)_1px,_transparent_1px)] bg-[size:96px_96px] opacity-40" />

      <div className="relative mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
        <header className="rounded-full border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="SOS logo" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" />
              <div>
                <p className="font-['Sora'] text-base font-semibold">SOS ProcureSphere 360</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300/72">Procurement, DMS, finance workflow</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-slate-200/78 lg:flex">
              <a href="#workflows" className="transition hover:text-white">
                Workflows
              </a>
              <a href="#governance" className="transition hover:text-white">
                Governance
              </a>
              <button
                type="button"
                onClick={() => openAuthModal("signin")}
                className="transition hover:text-white"
              >
                Access
              </button>
              <a href={api.docsUrl()} target="_blank" rel="noreferrer" className="transition hover:text-white">
                API docs
              </a>
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openAuthModal("signin")}
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14"
              >
                Sign in
              </button>
              {sessionUser ? (
                <Link
                  to="/app/overview"
                  className="inline-flex items-center justify-center rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-amber-300"
                >
                  Open workspace
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  className="inline-flex items-center justify-center rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-amber-300"
                >
                  Create account
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="grid gap-8 pb-10 pt-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.82fr)] xl:gap-10">
          <section className="max-w-[42rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100/90">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Unified control room for SOS Liberia operations
            </div>

            <h1 className="mt-7 max-w-[13ch] font-['Sora'] text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl xl:text-7xl">
              Modern procurement governance with a credible front door.
            </h1>

            <p className="mt-6 max-w-[38rem] text-lg leading-8 text-slate-200/82">
              SOS ProcureSphere 360 brings requisitions, sourcing, document evidence, budget controls, and payment approvals into one donor-ready platform designed for NGOs operating across multiple locations.
            </p>

            <div className="mt-6 grid gap-3">
              {highlightBullets.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-200/82">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {sessionUser ? (
                <Link
                  to="/app/overview"
                  className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-ink transition hover:bg-amber-300"
                >
                  Continue to workspace
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className="inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-ink transition hover:bg-amber-300"
                >
                  Sign in or create account
                </button>
              )}
              <a
                href={api.docsUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                Review API blueprint
              </a>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-[26px] border border-white/10 bg-white/6 p-5 backdrop-blur">
                  <p className="font-['Sora'] text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300/78">{stat.label}</p>
                </div>
              ))}
            </div>

            <div id="workflows" className="mt-8 grid gap-4 lg:grid-cols-3">
              {capabilityCards.map((card) => (
                <article key={card.title} className="rounded-[28px] border border-white/10 bg-slate-950/26 p-5 shadow-[0_20px_60px_rgba(4,10,20,0.18)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/78">Core module</p>
                  <h2 className="mt-3 font-['Sora'] text-xl font-semibold text-white">{card.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300/82">{card.text}</p>
                </article>
              ))}
            </div>

            <div id="governance" className="mt-8 rounded-[32px] border border-white/10 bg-white/7 p-6 shadow-[0_25px_80px_rgba(4,10,20,0.16)] backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/80">Governance posture</p>
                  <h3 className="mt-3 font-['Sora'] text-2xl font-semibold text-white">Built for donor scrutiny, not just internal convenience.</h3>
                </div>
                <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100">
                  Audit trail, retention, and SoD safeguards included
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  "Linked RFx, bid, PO, GRN, invoice, and payment evidence packs",
                  "Policy rule enforcement for quote thresholds and approval ladders",
                  "Pluggable finance and bank adapter model for production rollout"
                ].map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-slate-950/28 p-4 text-sm leading-7 text-slate-300/82">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Column: Hero Carousel prominent position + Quick Access card */}
          <section id="access" className="grid gap-5 self-start">
            <div className="rounded-[32px] border border-white/12 bg-slate-950/35 p-4 shadow-[0_25px_80px_rgba(4,10,20,0.3)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3 px-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/85">Liberia impact gallery</p>
                  <p className="mt-1 text-sm text-slate-300/80">Schools, villages, clinics, and vocational programmes in one rotating visual story.</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200/80">
                  Responsive carousel
                </div>
              </div>
              <HeroCarousel />
            </div>

            {/* Quick Access Card below carousel */}
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/90">Identity & Access</p>
                  <h3 className="mt-1 font-['Sora'] text-base font-semibold text-white">Enter procurement & finance workspace</h3>
                  <p className="mt-1 text-xs text-slate-300/75">Sign in to your role account or test with simulated procurement & finance personas.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => openAuthModal("signin")}
                    className="rounded-full bg-brand-gold px-4 py-2 text-xs font-semibold text-brand-ink transition hover:bg-amber-300"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal("signup")}
                    className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/14"
                  >
                    Create account
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Floating / Interactive Auth Modal */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={closeAuthModal}
        >
          <div
            className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthPortal
              users={users}
              locations={locations}
              departments={departments}
              sessionUser={sessionUser}
              loading={loading}
              initialTab={authModalTab}
              onClose={closeAuthModal}
              onLogin={async (email) => {
                await onLogin(email);
                closeAuthModal();
              }}
              onSignup={async (payload) => {
                await onSignup(payload);
                closeAuthModal();
              }}
              title={authModalTab === "signup" ? "Provision new access" : "Sign in to workspace"}
              subtitle="Authenticate to your procurement, finance, or supplier account, or choose a quick demo role."
            />
          </div>
        </div>
      )}
    </div>
  );
};
