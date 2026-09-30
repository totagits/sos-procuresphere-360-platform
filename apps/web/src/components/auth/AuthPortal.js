import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const tabStyles = {
    signin: "Sign in",
    signup: "Sign up"
};
export const AuthPortal = ({ users, locations, departments, sessionUser, loading, redirectTo = "/app/overview", title = "Secure access", subtitle = "Authenticate to procurement, finance, and document workflows with a role-based workspace.", initialTab = "signin", onClose, onLogin, onSignup }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [email, setEmail] = useState("");
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    const [signupForm, setSignupForm] = useState({
        name: "",
        email: "",
        title: "",
        locationId: "",
        departmentId: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
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
    const handleDemoLogin = async (nextEmail) => {
        try {
            setSubmitting(true);
            setError(null);
            await onLogin(nextEmail);
            navigate(redirectTo);
        }
        catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        await handleDemoLogin(email);
    };
    const handleSignupSubmit = async (event) => {
        event.preventDefault();
        try {
            setSubmitting(true);
            setError(null);
            await onSignup(signupForm);
            navigate(redirectTo);
        }
        catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Unable to create access.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const demoUsers = users.slice(0, 4);
    const isReady = !loading && locations.length > 0 && departments.length > 0;
    return (_jsxs("div", { className: "rounded-[32px] border border-white/12 bg-white/8 p-5 shadow-[0_30px_90px_rgba(3,10,20,0.34)] backdrop-blur-xl sm:p-6", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.32em] text-cyan-200/90", children: "Access portal" }), _jsx("h2", { className: "mt-3 font-['Sora'] text-2xl font-semibold text-white", children: title }), _jsx("p", { className: "mt-2 max-w-md text-sm leading-6 text-slate-200/82", children: subtitle })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100", children: "SSO, TOTP, and audit-ready session controls" }), onClose ? (_jsx("button", { type: "button", onClick: onClose, className: "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white", "aria-label": "Close dialog", children: _jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })) : null] })] }), sessionUser ? (_jsxs("button", { type: "button", onClick: handleContinueSession, className: "mt-5 w-full rounded-[24px] border border-cyan-300/25 bg-cyan-300/12 px-5 py-4 text-left transition hover:bg-cyan-300/18", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.28em] text-cyan-100/90", children: "Current session" }), _jsxs("p", { className: "mt-2 font-['Sora'] text-lg font-semibold text-white", children: ["Continue as ", sessionUser.name] }), _jsx("p", { className: "mt-1 text-sm text-slate-200/80", children: sessionUser.title })] })) : null, _jsx("div", { className: "mt-6 inline-flex rounded-full border border-white/12 bg-slate-950/35 p-1", children: Object.keys(tabStyles).map((tab) => (_jsx("button", { type: "button", onClick: () => {
                        setActiveTab(tab);
                        setError(null);
                    }, className: `rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"}`, children: tabStyles[tab] }, tab))) }), error ? (_jsx("div", { className: "mt-5 rounded-[22px] border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100", children: error })) : null, activeTab === "signin" ? (_jsxs("form", { className: "mt-5 grid gap-4", onSubmit: handleLoginSubmit, children: [_jsxs("label", { className: "grid gap-2 text-sm text-slate-200", children: ["Work email", _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), placeholder: "name@sosliberia.org", className: "rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60", required: true })] }), _jsx("button", { type: "submit", disabled: submitting, className: "inline-flex items-center justify-center rounded-[22px] bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70", children: submitting ? "Signing in..." : "Sign in to workspace" }), _jsxs("div", { className: "rounded-[24px] border border-white/10 bg-slate-950/30 p-4", children: [_jsx("div", { className: "flex items-center justify-between gap-3", children: _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.28em] text-slate-300/80", children: "Quick demo access" }), _jsx("p", { className: "mt-1 text-sm text-slate-300/82", children: "Use one tap to enter with a realistic procurement or finance role." })] }) }), _jsx("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: demoUsers.map((user) => (_jsxs("button", { type: "button", onClick: () => void handleDemoLogin(user.email), disabled: submitting, className: "rounded-[22px] border border-white/10 bg-white/6 p-4 text-left transition hover:border-cyan-300/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70", children: [_jsx("p", { className: "font-['Sora'] text-sm font-semibold text-white", children: user.name }), _jsx("p", { className: "mt-1 text-sm text-slate-300/80", children: user.title }), _jsx("p", { className: "mt-3 text-[11px] uppercase tracking-[0.26em] text-cyan-100/85", children: user.roles.map((role) => role.name).join(" / ") })] }, user.id))) })] })] })) : (_jsxs("form", { className: "mt-5 grid gap-4", onSubmit: handleSignupSubmit, children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("label", { className: "grid gap-2 text-sm text-slate-200 sm:col-span-2", children: ["Full name", _jsx("input", { type: "text", value: signupForm.name, onChange: (event) => setSignupForm((current) => ({ ...current, name: event.target.value })), placeholder: "Enter full name", className: "rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60", required: true })] }), _jsxs("label", { className: "grid gap-2 text-sm text-slate-200 sm:col-span-2", children: ["Work email", _jsx("input", { type: "email", value: signupForm.email, onChange: (event) => setSignupForm((current) => ({ ...current, email: event.target.value })), placeholder: "name@sosliberia.org", className: "rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60", required: true })] }), _jsxs("label", { className: "grid gap-2 text-sm text-slate-200 sm:col-span-2", children: ["Job title", _jsx("input", { type: "text", value: signupForm.title, onChange: (event) => setSignupForm((current) => ({ ...current, title: event.target.value })), placeholder: "Programme Coordinator", className: "rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60", required: true })] }), _jsxs("label", { className: "grid gap-2 text-sm text-slate-200", children: ["Location", _jsx("select", { value: signupForm.locationId, onChange: (event) => setSignupForm((current) => ({ ...current, locationId: event.target.value })), className: "rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60", disabled: !isReady || submitting, required: true, children: locations.map((location) => (_jsx("option", { value: location.id, className: "text-slate-950", children: location.name }, location.id))) })] }), _jsxs("label", { className: "grid gap-2 text-sm text-slate-200", children: ["Department", _jsx("select", { value: signupForm.departmentId, onChange: (event) => setSignupForm((current) => ({ ...current, departmentId: event.target.value })), className: "rounded-[22px] border border-white/14 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60", disabled: !isReady || submitting, required: true, children: departments.map((department) => (_jsx("option", { value: department.id, className: "text-slate-950", children: department.name }, department.id))) })] })] }), _jsxs("div", { className: "rounded-[22px] border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300/86", children: ["New accounts are provisioned as ", _jsx("span", { className: "font-semibold text-white", children: "Programme Requesters" }), " so they can create requisitions and follow approvals while governance roles remain segregated."] }), _jsx("button", { type: "submit", disabled: !isReady || submitting, className: "inline-flex items-center justify-center rounded-[22px] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70", children: submitting ? "Creating access..." : "Create account and continue" })] }))] }));
};
