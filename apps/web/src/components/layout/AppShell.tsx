import { NavLink, Outlet } from "react-router-dom";
import type { Role, User } from "@sos-procuresphere/shared";
import { ActionButton } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";

const navigation = [
  { to: "/app/overview", label: "Overview" },
  { to: "/app/suppliers", label: "Suppliers" },
  { to: "/app/procurement", label: "Procurement" },
  { to: "/app/finance", label: "Finance" },
  { to: "/app/documents", label: "Documents" },
  { to: "/app/audit", label: "Audit" }
];

export const AppShell = ({
  user,
  roles,
  users,
  onSwitchUser,
  onResetDemo,
  onLogout
}: {
  user: User;
  roles: Role[];
  users: Array<User & { roles: Role[] }>;
  onSwitchUser: (userId: string) => void;
  onResetDemo: () => void;
  onLogout: () => void;
}) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(30,203,225,0.16),_transparent_24%),_linear-gradient(180deg,_#f7fbff,_#eef6fb)] text-brand-ink">
    <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
      <aside className="border-b border-slate-200/70 bg-white/80 px-5 py-6 backdrop-blur lg:min-h-screen lg:w-[290px] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="SOS logo" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-sky-100" />
          <div>
            <p className="font-['Sora'] text-lg font-semibold">SOS ProcureSphere 360</p>
            <p className="text-sm text-slate-500">Procure-to-pay, DMS, finance controls</p>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-sky-100 bg-sky-50/60 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-700">Active user</p>
          <p className="mt-3 font-['Sora'] text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-slate-600">{user.title}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span key={role.id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-100">
                {role.name}
              </span>
            ))}
          </div>
        </div>

        <label className="mt-6 block text-sm font-medium text-slate-600">
          Role switcher
          <select
            value={user.id}
            onChange={(event) => onSwitchUser(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          >
            {users.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} - {option.roles.map((role) => role.name).join(", ")}
              </option>
            ))}
          </select>
        </label>

        <nav className="mt-8 grid gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-brand-ink text-white shadow-lg" : "text-slate-600 hover:bg-slate-100"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 flex flex-col gap-3">
          <ActionButton tone="secondary" onClick={onResetDemo}>
            Reset demo state
          </ActionButton>
          <ActionButton tone="ghost" onClick={onLogout}>
            Sign out
          </ActionButton>
        </div>
      </aside>

      <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_18px_45px_rgba(8,22,38,0.08)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-700">Unified control room</p>
            <h1 className="mt-2 font-['Sora'] text-3xl font-semibold">Operational visibility for procurement, finance, and audit teams</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex items-center justify-center rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              href={api.docsUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Open API docs
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-sky-50"
              href="/"
            >
              Public landing page
            </a>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  </div>
);
