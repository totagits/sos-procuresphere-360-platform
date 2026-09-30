import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { api, clearUserId, currentUserId, persistUserId } from "@/lib/api";
import { AuthPage } from "@/pages/AuthPage";
import { LandingPage } from "@/pages/LandingPage";
import { AuditPage } from "@/pages/app/AuditPage";
import { DocumentsPage } from "@/pages/app/DocumentsPage";
import { FinancePage } from "@/pages/app/FinancePage";
import { OverviewPage } from "@/pages/app/OverviewPage";
import { ProcurementPage } from "@/pages/app/ProcurementPage";
import { SuppliersPage } from "@/pages/app/SuppliersPage";
const queryClient = new QueryClient();
const LoadingScreen = () => (_jsx("div", { className: "grid min-h-screen place-items-center bg-[linear-gradient(145deg,_#061120_0%,_#0b1e33_40%,_#0e2740_100%)] px-4 text-white", children: _jsxs("div", { className: "rounded-[28px] border border-white/12 bg-white/8 px-8 py-6 text-center shadow-[0_24px_70px_rgba(4,10,20,0.28)] backdrop-blur", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.32em] text-cyan-100/80", children: "Loading workspace" }), _jsx("p", { className: "mt-3 font-['Sora'] text-2xl font-semibold", children: "Preparing SOS ProcureSphere 360" }), _jsx("p", { className: "mt-2 text-sm text-slate-300/80", children: "Restoring access context, roles, and workflow controls." })] }) }));
export const App = () => {
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [session, setSession] = useState(null);
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
                    }
                    catch {
                        clearUserId();
                    }
                }
            }
            finally {
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
    const handleLogin = async (email) => {
        const payload = await api.login(email);
        persistUserId(payload.user.id);
        setSession(payload);
    };
    const handleSignup = async (payload) => {
        const nextSession = await api.signup(payload);
        persistUserId(nextSession.user.id);
        setSession(nextSession);
        await refreshAuthBootstrap();
    };
    const handleSwitchUser = (userId) => {
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
                }
                catch {
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
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, { users: users, locations: locations, departments: departments, sessionUser: session?.user, loading: initializing, onLogin: handleLogin, onSignup: handleSignup }) }), _jsx(Route, { path: "/auth", element: initializing ? (_jsx(LoadingScreen, {})) : (_jsx(AuthPage, { users: users, locations: locations, departments: departments, sessionUser: session?.user, onLogin: handleLogin, onSignup: handleSignup })) }), _jsxs(Route, { path: "/app", element: initializing ? (_jsx(LoadingScreen, {})) : session ? (_jsx(AppShell, { user: session.user, roles: session.roles, users: users, onSwitchUser: handleSwitchUser, onResetDemo: handleResetDemo, onLogout: handleLogout })) : (_jsx(Navigate, { to: "/auth", replace: true })), children: [_jsx(Route, { path: "overview", element: session ? _jsx(OverviewPage, {}) : _jsx(Navigate, { to: "/auth", replace: true }) }), _jsx(Route, { path: "suppliers", element: session ? _jsx(SuppliersPage, {}) : _jsx(Navigate, { to: "/auth", replace: true }) }), _jsx(Route, { path: "procurement", element: session ? _jsx(ProcurementPage, {}) : _jsx(Navigate, { to: "/auth", replace: true }) }), _jsx(Route, { path: "finance", element: session ? _jsx(FinancePage, {}) : _jsx(Navigate, { to: "/auth", replace: true }) }), _jsx(Route, { path: "documents", element: session ? _jsx(DocumentsPage, {}) : _jsx(Navigate, { to: "/auth", replace: true }) }), _jsx(Route, { path: "audit", element: session ? _jsx(AuditPage, {}) : _jsx(Navigate, { to: "/auth", replace: true }) }), _jsx(Route, { index: true, element: _jsx(Navigate, { to: session ? "/app/overview" : "/auth", replace: true }) })] })] }) }) }));
};
