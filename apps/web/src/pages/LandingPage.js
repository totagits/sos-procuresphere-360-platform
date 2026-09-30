import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthPortal } from "@/components/auth/AuthPortal";
import { HeroCarousel } from "@/components/marketing/HeroCarousel";
import { api } from "@/lib/api";
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
export const LandingPage = ({ users, locations, departments, sessionUser, loading, onLogin, onSignup }) => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState("signin");
    const openAuthModal = (tab = "signin") => {
        setAuthModalTab(tab);
        setIsAuthModalOpen(true);
    };
    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                closeAuthModal();
            }
        };
        if (isAuthModalOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAuthModalOpen]);
    return (_jsxs("div", { className: "min-h-screen overflow-hidden bg-[linear-gradient(145deg,_#061120_0%,_#0b1e33_40%,_#0e2740_100%)] text-white", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_26%),_radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_18%)]" }), _jsx("div", { className: "pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.035)_1px,_transparent_1px)] bg-[size:96px_96px] opacity-40" }), _jsxs("div", { className: "relative mx-auto max-w-[1440px] px-5 py-6 lg:px-8", children: [_jsx("header", { className: "rounded-full border border-white/10 bg-white/6 px-4 py-3 backdrop-blur", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [_jsx("img", { src: "/logo.jpg", alt: "SOS logo", className: "h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" }), _jsxs("div", { children: [_jsx("p", { className: "font-['Sora'] text-base font-semibold", children: "SOS ProcureSphere 360" }), _jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-slate-300/72", children: "Procurement, DMS, finance workflow" })] })] }), _jsxs("nav", { className: "hidden items-center gap-6 text-sm text-slate-200/78 lg:flex", children: [_jsx("a", { href: "#workflows", className: "transition hover:text-white", children: "Workflows" }), _jsx("a", { href: "#governance", className: "transition hover:text-white", children: "Governance" }), _jsx("button", { type: "button", onClick: () => openAuthModal("signin"), className: "transition hover:text-white", children: "Access" }), _jsx("a", { href: api.docsUrl(), target: "_blank", rel: "noreferrer", className: "transition hover:text-white", children: "API docs" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => openAuthModal("signin"), className: "inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14", children: "Sign in" }), sessionUser ? (_jsx(Link, { to: "/app/overview", className: "inline-flex items-center justify-center rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-amber-300", children: "Open workspace" })) : (_jsx("button", { type: "button", onClick: () => openAuthModal("signup"), className: "inline-flex items-center justify-center rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-amber-300", children: "Create account" }))] })] }) }), _jsxs("main", { className: "grid gap-8 pb-10 pt-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.82fr)] xl:gap-10", children: [_jsxs("section", { className: "max-w-[42rem]", children: [_jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100/90", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-cyan-300" }), "Unified control room for SOS Liberia operations"] }), _jsx("h1", { className: "mt-7 max-w-[13ch] font-['Sora'] text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl xl:text-7xl", children: "Modern procurement governance with a credible front door." }), _jsx("p", { className: "mt-6 max-w-[38rem] text-lg leading-8 text-slate-200/82", children: "SOS ProcureSphere 360 brings requisitions, sourcing, document evidence, budget controls, and payment approvals into one donor-ready platform designed for NGOs operating across multiple locations." }), _jsx("div", { className: "mt-6 grid gap-3", children: highlightBullets.map((item) => (_jsxs("div", { className: "flex items-start gap-3 text-sm leading-7 text-slate-200/82", children: [_jsx("span", { className: "mt-2 h-2.5 w-2.5 rounded-full bg-brand-gold" }), _jsx("span", { children: item })] }, item))) }), _jsxs("div", { className: "mt-8 flex flex-wrap gap-4", children: [sessionUser ? (_jsx(Link, { to: "/app/overview", className: "inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-ink transition hover:bg-amber-300", children: "Continue to workspace" })) : (_jsx("button", { type: "button", onClick: () => openAuthModal("signin"), className: "inline-flex items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-ink transition hover:bg-amber-300", children: "Sign in or create account" })), _jsx("a", { href: api.docsUrl(), target: "_blank", rel: "noreferrer", className: "inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/14", children: "Review API blueprint" })] }), _jsx("div", { className: "mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: heroStats.map((stat) => (_jsxs("div", { className: "rounded-[26px] border border-white/10 bg-white/6 p-5 backdrop-blur", children: [_jsx("p", { className: "font-['Sora'] text-3xl font-semibold text-white", children: stat.value }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-300/78", children: stat.label })] }, stat.label))) }), _jsx("div", { id: "workflows", className: "mt-8 grid gap-4 lg:grid-cols-3", children: capabilityCards.map((card) => (_jsxs("article", { className: "rounded-[28px] border border-white/10 bg-slate-950/26 p-5 shadow-[0_20px_60px_rgba(4,10,20,0.18)] backdrop-blur", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.28em] text-cyan-100/78", children: "Core module" }), _jsx("h2", { className: "mt-3 font-['Sora'] text-xl font-semibold text-white", children: card.title }), _jsx("p", { className: "mt-3 text-sm leading-7 text-slate-300/82", children: card.text })] }, card.title))) }), _jsxs("div", { id: "governance", className: "mt-8 rounded-[32px] border border-white/10 bg-white/7 p-6 shadow-[0_25px_80px_rgba(4,10,20,0.16)] backdrop-blur", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-cyan-100/80", children: "Governance posture" }), _jsx("h3", { className: "mt-3 font-['Sora'] text-2xl font-semibold text-white", children: "Built for donor scrutiny, not just internal convenience." })] }), _jsx("div", { className: "rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100", children: "Audit trail, retention, and SoD safeguards included" })] }), _jsx("div", { className: "mt-5 grid gap-4 sm:grid-cols-3", children: [
                                                    "Linked RFx, bid, PO, GRN, invoice, and payment evidence packs",
                                                    "Policy rule enforcement for quote thresholds and approval ladders",
                                                    "Pluggable finance and bank adapter model for production rollout"
                                                ].map((item) => (_jsx("div", { className: "rounded-[24px] border border-white/10 bg-slate-950/28 p-4 text-sm leading-7 text-slate-300/82", children: item }, item))) })] })] }), _jsxs("section", { id: "access", className: "grid gap-5 self-start", children: [_jsxs("div", { className: "rounded-[32px] border border-white/12 bg-slate-950/35 p-4 shadow-[0_25px_80px_rgba(4,10,20,0.3)] backdrop-blur", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between gap-3 px-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.28em] text-cyan-100/85", children: "Liberia impact gallery" }), _jsx("p", { className: "mt-1 text-sm text-slate-300/80", children: "Schools, villages, clinics, and vocational programmes in one rotating visual story." })] }), _jsx("div", { className: "rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200/80", children: "Responsive carousel" })] }), _jsx(HeroCarousel, {})] }), _jsx("div", { className: "rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.28em] text-cyan-200/90", children: "Identity & Access" }), _jsx("h3", { className: "mt-1 font-['Sora'] text-base font-semibold text-white", children: "Enter procurement & finance workspace" }), _jsx("p", { className: "mt-1 text-xs text-slate-300/75", children: "Sign in to your role account or test with simulated procurement & finance personas." })] }), _jsxs("div", { className: "flex flex-wrap gap-2.5", children: [_jsx("button", { type: "button", onClick: () => openAuthModal("signin"), className: "rounded-full bg-brand-gold px-4 py-2 text-xs font-semibold text-brand-ink transition hover:bg-amber-300", children: "Sign in" }), _jsx("button", { type: "button", onClick: () => openAuthModal("signup"), className: "rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/14", children: "Create account" })] })] }) })] })] })] }), isAuthModalOpen && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in", onClick: closeAuthModal, children: _jsx("div", { className: "relative w-full max-w-xl max-h-[92vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: _jsx(AuthPortal, { users: users, locations: locations, departments: departments, sessionUser: sessionUser, loading: loading, initialTab: authModalTab, onClose: closeAuthModal, onLogin: async (email) => {
                            await onLogin(email);
                            closeAuthModal();
                        }, onSignup: async (payload) => {
                            await onSignup(payload);
                            closeAuthModal();
                        }, title: authModalTab === "signup" ? "Provision new access" : "Sign in to workspace", subtitle: "Authenticate to your procurement, finance, or supplier account, or choose a quick demo role." }) }) }))] }));
};
