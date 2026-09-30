import { useEffect, useState } from "react";

const slides = [
  {
    src: "/media/lively-classroom.png",
    title: "Classroom continuity",
    caption: "Track donor-funded education spend, supplies, and approvals with one shared control tower."
  },
  {
    src: "/media/children-village.png",
    title: "Village operations",
    caption: "Give every SOS location a consistent procurement, document, and audit workflow."
  },
  {
    src: "/media/clinic-interior.png",
    title: "Medical readiness",
    caption: "Move high-risk health procurements through sourcing, approvals, receiving, and payments safely."
  },
  {
    src: "/media/vocational-workshop.png",
    title: "Skills and livelihoods",
    caption: "Support workshop equipment, maintenance, and service contracts with better traceability."
  }
];

export const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/20 bg-brand-ink p-3 shadow-glow">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,203,225,0.22),_transparent_45%)]" />
      <div className="relative h-full min-h-[440px] overflow-hidden rounded-[28px]">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-all duration-700 ${index === activeIndex ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
          >
            <img src={slide.src} alt={slide.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="max-w-md rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-100">Liberia Impact Lens</p>
                <h3 className="mt-2 font-['Sora'] text-2xl font-semibold text-white">{slide.title}</h3>
                <p className="mt-3 text-sm leading-6 text-sky-50/85">{slide.caption}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-4 px-2 pb-1">
        <div className="flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-10 bg-cyan-300" : "w-2.5 bg-white/35"}`}
              aria-label={`Show ${slide.title}`}
            />
          ))}
        </div>
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">PWA-ready across mobile and web</p>
      </div>
    </div>
  );
};
