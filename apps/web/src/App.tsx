import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { Department, Location, Role, User } from "@sos-procuresphere/shared";
import { AppShell } from "@/components/layout/AppShell";
import { api, clearUserId, currentUserId, persistUserId, type SessionPayload, type SignupPayload } from "@/lib/api";
import { AuthPage } from "@/pages/AuthPage";
import { LandingPage } from "@/pages/LandingPage";
import { AuditPage } from "@/pages/app/AuditPage";
import { DocumentsPage } from "@/pages/app/DocumentsPage";
import { FinancePage } from "@/pages/app/FinancePage";
import { OverviewPage } from "@/pages/app/OverviewPage";
import { ProcurementPage } from "@/pages/app/ProcurementPage";
import { SuppliersPage } from "@/pages/app/SuppliersPage";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,_#061120_0%,_#0b1e33_40%,_#0e2740_100%)] px-4 text-white">
    <div className="rounded-[28px] border border-white/12 bg-white/8 px-8 py-6 text-center shadow-[0_24px_70px_rgba(4,10,20,0.28)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/80">Loading workspace</p>
      <p className="mt-3 font-['Sora'] text-2xl font-semibold">Preparing SOS ProcureSphere 360</p>
      <p className="mt-2 text-sm text-slate-300/80">Restoring access context, roles, and workflow controls.</p>
    </div>
  </div>
);

export const App = () => {
  const [users, setUsers] = useState<Array<User & { roles: Role[] }>>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshAuthBootstrap = async () => {
    const payload = await api.authBootstrap();
    setUsers(payload.users);
    setLocations(payload.locations);
    setDepartments(payload.departments);
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const payload = await api.authBootstrap();
        if (!active) {
          return;
        }

        setUsers(payload.users);
        setLocations(payload.locations);
        setDepartments(payload.departments);

        const storedUserId = currentUserId();
        if (storedUserId) {
          try {
            const nextSession = await api.session(storedUserId);
            if (active) {
              setSession(nextSession);
            }
          } catch {
            clearUserId();
          }
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (email: string) => {
    const payload = await api.login(email);
    persistUserId(payload.user.id);
    setSession(payload);
  };

  const handleSignup = async (payload: SignupPayload) => {
    const nextSession = await api.signup(payload);
    persistUserId(nextSession.user.id);
    setSession(nextSession);
    await refreshAuthBootstrap();
  };

  const handleSwitchUser = (userId: string) => {
    persistUserId(userId);
    void api.session(userId).then((payload) => setSession(payload));
  };

  const handleResetDemo = () => {
    void api.resetDemo().then(async () => {
      queryClient.clear();
      await refreshAuthBootstrap();

      const storedUserId = currentUserId();
      if (storedUserId) {
        try {
          const payload = await api.session(storedUserId);
          setSession(payload);
          return;
        } catch {
          clearUserId();
        }
      }

      setSession(null);
    });
  };

  const handleLogout = () => {
    clearUserId();
    setSession(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                users={users}
                locations={locations}
                departments={departments}
                sessionUser={session?.user}
                loading={initializing}
                onLogin={handleLogin}
                onSignup={handleSignup}
              />
            }
          />
          <Route
            path="/auth"
            element={
              initializing ? (
                <LoadingScreen />
              ) : (
                <AuthPage
                  users={users}
                  locations={locations}
                  departments={departments}
                  sessionUser={session?.user}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                />
              )
            }
          />
          <Route
            path="/app"
            element={
              initializing ? (
                <LoadingScreen />
              ) : session ? (
                <AppShell
                  user={session.user}
                  roles={session.roles}
                  users={users}
                  onSwitchUser={handleSwitchUser}
                  onResetDemo={handleResetDemo}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          >
            <Route path="overview" element={session ? <OverviewPage /> : <Navigate to="/auth" replace />} />
            <Route path="suppliers" element={session ? <SuppliersPage /> : <Navigate to="/auth" replace />} />
            <Route path="procurement" element={session ? <ProcurementPage /> : <Navigate to="/auth" replace />} />
            <Route path="finance" element={session ? <FinancePage /> : <Navigate to="/auth" replace />} />
            <Route path="documents" element={session ? <DocumentsPage /> : <Navigate to="/auth" replace />} />
            <Route path="audit" element={session ? <AuditPage /> : <Navigate to="/auth" replace />} />
            <Route index element={<Navigate to={session ? "/app/overview" : "/auth"} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
