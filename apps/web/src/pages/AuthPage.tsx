import { Link } from "react-router-dom";
import type { Department, Location, Role, User } from "@sos-procuresphere/shared";
import { AuthPortal } from "@/components/auth/AuthPortal";
import type { SignupPayload } from "@/lib/api";

export const AuthPage = ({
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
}) => (
  <div className="min-h-screen overflow-hidden bg-[linear-gradient(160deg,_#071221_0%,_#0c1f36_40%,_#15314a_100%)] text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_24%),_radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_20%)]" />
    <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="SOS logo" className="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/10" />
          <div>
            <p className="font-['Sora'] text-base font-semibold">SOS ProcureSphere 360</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300/70">Secure access and identity orchestration</p>
          </div>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14"
        >
          Back to landing page
        </Link>
      </header>

      <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
        <section className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-200/85">Identity and access</p>
          <h1 className="mt-5 max-w-xl font-['Sora'] text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Sign in with a polished, role-aware entry point built for a serious operations platform.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-200/82">
            Procurement, finance, warehouse, and audit teams need a clear front door. This access flow supports secure sign-in, rapid demo entry, and new requester provisioning without sending users into an unfinished prototype state.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Role-based entry",
                value: "RBAC"
              },
              {
                label: "Two-factor path",
                value: "TOTP"
              },
              {
                label: "Session traceability",
                value: "Audit log"
              }
            ].map((item) => (
              <div key={item.label} className="rounded-[26px] border border-white/10 bg-white/6 p-5 backdrop-blur">
                <p className="font-['Sora'] text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm text-slate-300/78">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-950/30 p-5 text-sm leading-7 text-slate-300/82">
            Production deployment can be wired to SSO, SAML, OIDC, enforced TOTP, and device controls. The current pilot keeps the interface production-shaped while the backend remains easy to demonstrate and extend.
          </div>
        </section>

        <section>
          <AuthPortal
            users={users}
            locations={locations}
            departments={departments}
            sessionUser={sessionUser}
            loading={loading}
            onLogin={onLogin}
            onSignup={onSignup}
            title="Sign in or provision a requester account"
            subtitle="Use a work email to enter the platform, or create a programme requester profile for requisition and document workflows."
          />
        </section>
      </div>
    </div>
  </div>
);
