import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Department, Location, Role, User } from "@sos-procuresphere/shared";
import type { SignupPayload } from "@/lib/api";

type AuthTab = "signin" | "signup";

const tabStyles: Record<AuthTab, string> = {
  signin: "Sign in",
  signup: "Sign up"
};

export const AuthPortal = ({
  users,
  locations,
  departments,
  sessionUser,
  loading,
  redirectTo = "/app/overview",
  title = "Secure access",
  subtitle = "Authenticate to procurement, finance, and document workflows with a role-based workspace.",
  initialTab = "signin",
  onClose,
  onLogin,
  onSignup
}: {
  users: Array<User & { roles: Role[] }>;
  locations: Location[];
  departments: Department[];
  sessionUser?: User | null;
  loading?: boolean;
  redirectTo?: string;
  title?: string;
  subtitle?: string;
  initialTab?: AuthTab;
  onClose?: () => void;
  onLogin: (email: string) => Promise<void>;
  onSignup: (payload: SignupPayload) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [signupForm, setSignupForm] = useState<SignupPayload>({
    name: "",
    email: "",
    title: "",
    locationId: "",
    departmentId: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSignupForm((current) => ({
      ...current,
      locationId: current.locationId || locations[0]?.id || "",
      departmentId: current.departmentId || departments[0]?.id || ""
    }));
  }, [locations, departments]);

  const handleContinueSession = () => {
    navigate(redirectTo);
  };

  const handleDemoLogin = async (nextEmail: string) => {
    try {
      setSubmitting(true);
      setError(null);
      await onLogin(nextEmail);
      navigate(redirectTo);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleDemoLogin(email);
  };

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      await onSignup(signupForm);
      navigate(redirectTo);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create access.");
    } finally {
      setSubmitting(false);
    }
  };

  const demoUsers = users.slice(0, 4);
  const isReady = !loading && locations.length > 0 && departments.length > 0;

  return (
    <div className="rounded-[32px] border border-white/12 bg-white/8 p-5 shadow-[0_30px_90px_rgba(3,10,20,0.34)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/90">Access portal</p>
          <h2 className="mt-3 font-['Sora'] text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-200/82">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100">
            SSO, TOTP, and audit-ready session controls
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              aria-label="Close dialog"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {sessionUser ? (
        <button
          type="button"
          onClick={handleContinueSession}
          className="mt-5 w-full rounded-[24px] border border-cyan-300/25 bg-cyan-300/12 px-5 py-4 text-left transition hover:bg-cyan-300/18"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/90">Current session</p>
          <p className="mt-2 font-['Sora'] text-lg font-semibold text-white">Continue as {sessionUser.name}</p>
          <p className="mt-1 text-sm text-slate-200/80">{sessionUser.title}</p>
        </button>
      ) : null}

      <div className="mt-6 inline-flex rounded-full border border-white/12 bg-slate-950/35 p-1">
        {(Object.keys(tabStyles) as AuthTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setError(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
            }`}
          >
            {tabStyles[tab]}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-5 rounded-[22px] border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {activeTab === "signin" ? (
        <form className="mt-5 grid gap-4" onSubmit={handleLoginSubmit}>
          <label className="grid gap-2 text-sm text-slate-200">
            Work email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@sosliberia.org"
              className="rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-[22px] bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign in to workspace"}
          </button>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300/80">Quick demo access</p>
                <p className="mt-1 text-sm text-slate-300/82">Use one tap to enter with a realistic procurement or finance role.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {demoUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => void handleDemoLogin(user.email)}
                  disabled={submitting}
                  className="rounded-[22px] border border-white/10 bg-white/6 p-4 text-left transition hover:border-cyan-300/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <p className="font-['Sora'] text-sm font-semibold text-white">{user.name}</p>
                  <p className="mt-1 text-sm text-slate-300/80">{user.title}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.26em] text-cyan-100/85">
                    {user.roles.map((role) => role.name).join(" / ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </form>
      ) : (
        <form className="mt-5 grid gap-4" onSubmit={handleSignupSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-200 sm:col-span-2">
              Full name
              <input
                type="text"
                value={signupForm.name}
                onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Enter full name"
                className="rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                required
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-200 sm:col-span-2">
              Work email
              <input
                type="email"
                value={signupForm.email}
                onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@sosliberia.org"
                className="rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                required
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-200 sm:col-span-2">
              Job title
              <input
                type="text"
                value={signupForm.title}
                onChange={(event) => setSignupForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Programme Coordinator"
                className="rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                required
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              Location
              <select
                value={signupForm.locationId}
                onChange={(event) => setSignupForm((current) => ({ ...current, locationId: event.target.value }))}
                className="rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                disabled={!isReady || submitting}
                required
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id} className="text-slate-950">
                    {location.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              Department
              <select
                value={signupForm.departmentId}
                onChange={(event) => setSignupForm((current) => ({ ...current, departmentId: event.target.value }))}
                className="rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                disabled={!isReady || submitting}
                required
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id} className="text-slate-950">
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300/86">
            New accounts are provisioned as <span className="font-semibold text-white">Programme Requesters</span> so they can create requisitions and follow approvals while governance roles remain segregated.
          </div>

          <button
            type="submit"
            disabled={!isReady || submitting}
            className="inline-flex items-center justify-center rounded-[22px] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating access..." : "Create account and continue"}
          </button>
        </form>
      )}
    </div>
  );
};
