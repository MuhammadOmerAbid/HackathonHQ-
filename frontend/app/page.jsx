"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

/* ══ useReveal ══ */
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, on];
}

/* ══ SlideUp ══ */
function SlideUp({ children, delay = 0, className = "", style = {} }) {
  const [ref, on] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "translateY(0px)" : "translateY(44px)",
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ══ Animated counter ══ */
function Counter({ to, suffix = "" }) {
  const [v, setV] = useState(0);
  const [ref, on] = useReveal(0.5);
  useEffect(() => {
    if (!on) return;
    let cur = 0;
    const step = Math.ceil(to / 50);
    const id = setInterval(() => { cur = Math.min(cur + step, to); setV(cur); if (cur >= to) clearInterval(id); }, 24);
    return () => clearInterval(id);
  }, [on, to]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}

/* ══ 3-D tilt card ══ */
function TiltCard({ children, className = "", style = {}, intensity = 14 }) {
  const ref = useRef(null);
  const move = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.03)`;
    el.style.boxShadow = `${-x * 22}px ${y * 22}px 64px rgba(110,231,183,.1)`;
  }, [intensity]);
  const leave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(900px) rotateY(0) rotateX(0) scale(1)";
    el.style.boxShadow = "";
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ transition: "transform .18s ease, box-shadow .18s ease", willChange: "transform", ...style }}
      onMouseMove={move} onMouseLeave={leave}>
      {children}
    </div>
  );
}

/* ══ Canvas particle mesh ══ */
function ParticleMesh({ count = 70, color = "110,231,183" }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const pts = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    for (let i = 0; i < count; i++) pts.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.6 + .4 });
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
        if (d < 130) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(${color},${(1 - d / 130) * .16})`; ctx.lineWidth = .6; ctx.stroke(); }
      }
      for (const p of pts) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        g.addColorStop(0, `rgba(${color},.85)`); g.addColorStop(1, `rgba(${color},0)`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ══ Marquee ticker ══ */
function Ticker({ items }) {
  return (
    <div className="ticker-root" aria-hidden="true">
      <div className="ticker-track">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-dot">◆</span>{item}
          </span>
        ))}
      </div>
      <style jsx>{`
        .ticker-root{overflow:hidden;border-top:1px solid #1e1e24;border-bottom:1px solid #1e1e24;background:#111114;padding:14px 0}
        .ticker-track{display:flex;animation:tickerScroll 40s linear infinite;width:max-content}
        .ticker-track:hover{animation-play-state:paused}
        .ticker-item{display:flex;align-items:center;gap:12px;padding:0 28px;font-size:13px;font-weight:500;color:#5c5c6e;white-space:nowrap;font-family:'DM Sans',sans-serif;letter-spacing:.3px}
        .ticker-dot{color:#6EE7B7;font-size:8px}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      `}</style>
    </div>
  );
}

/* ══ Feature slideshow ══ */
const FEATURES = [
  { num: "01", emoji: "🎯", title: "Discover Events",    desc: "Browse hackathons by tech stack, prize pool, and timeline. Smart filters surface exactly what matches your skills.", color: "#6EE7B7" },
  { num: "02", emoji: "👥", title: "Form Dream Teams",   desc: "Connect with developers, designers, and strategists. Build your lineup before the starting gun fires.", color: "#60a5fa" },
  { num: "03", emoji: "🚀", title: "Submit Projects",    desc: "Submit with demo links, repos, tech stack, and a full description. Every detail presented beautifully to judges.", color: "#a78bfa" },
  { num: "04", emoji: "⚖️", title: "Expert Judging",    desc: "Industry professionals score every project with structured numerical feedback. No black boxes — you see exactly how you scored.", color: "#fbbf24" },
  { num: "05", emoji: "💬", title: "Community Feed",    desc: "Announcements, discussions, direct messages. The social layer your team needs — all built in.", color: "#f472b6" },
  { num: "06", emoji: "🏆", title: "Win & Get Noticed", desc: "Winner badges, leaderboard rankings, and visibility to companies that actively scout hackathon talent.", color: "#6EE7B7" },
];

function FeatureSlideshow() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % FEATURES.length), 3800);
    return () => clearInterval(id);
  }, []);
  const f = FEATURES[active];
  return (
    <div className="fs">
      <div className="fs-tabs">
        {FEATURES.map((feat, i) => (
          <button key={i} className={`fs-tab${i === active ? " fs-tab-on" : ""}`}
            onClick={() => setActive(i)}
            style={i === active ? { borderColor: feat.color, color: feat.color } : {}}>
            <span className="fs-tab-em">{feat.emoji}</span>
            <span className="fs-tab-lbl">{feat.title}</span>
          </button>
        ))}
      </div>
      <TiltCard className="fs-panel" intensity={8}>
        <div key={active} className="fs-panel-inner">
          <div className="fs-panel-bg" style={{ background: `radial-gradient(ellipse at 80% 20%, ${f.color}14, transparent 60%)` }} />
          <div className="fs-big-num">{f.num}</div>
          <div className="fs-emoji-big">{f.emoji}</div>
          <h3 className="fs-title" style={{ color: f.color }}>{f.title}</h3>
          <p className="fs-desc">{f.desc}</p>
          <div className="fs-prog-wrap">
            <div className="fs-prog" style={{ background: f.color }} />
          </div>
        </div>
      </TiltCard>
      <div className="fs-dots">
        {FEATURES.map((feat, i) => (
          <button key={i} className={`fs-dot${i === active ? " fs-dot-on" : ""}`}
            style={i === active ? { background: feat.color, width: 22 } : {}}
            onClick={() => setActive(i)} />
        ))}
      </div>
      <style jsx>{`
        .fs{} .fs-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}
        .fs-tab{display:flex;align-items:center;gap:8px;padding:9px 18px;border-radius:100px;font-size:13px;font-weight:600;background:#111114;border:1px solid #1e1e24;color:#5c5c6e;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
        .fs-tab:hover{border-color:#26262e;color:#888} .fs-tab-on{background:#17171b}
        .fs-tab-em{font-size:15px} .fs-tab-lbl{white-space:nowrap}
        .fs-panel{background:#111114;border:1px solid #1e1e24;border-radius:22px;overflow:hidden;cursor:default}
        .fs-panel-inner{padding:60px 56px;position:relative;min-height:300px;animation:fsIn .4s cubic-bezier(.16,1,.3,1) both}
        @keyframes fsIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fs-panel-bg{position:absolute;inset:0;pointer-events:none}
        .fs-big-num{position:absolute;top:20px;right:40px;font-family:'Syne',sans-serif;font-size:108px;font-weight:800;color:rgba(240,240,243,.03);letter-spacing:-6px;line-height:1;pointer-events:none;user-select:none}
        .fs-emoji-big{font-size:48px;display:block;margin-bottom:22px}
        .fs-title{font-family:'Syne',sans-serif;font-size:30px;font-weight:800;letter-spacing:-.8px;margin:0 0 14px}
        .fs-desc{font-size:16px;color:#888;line-height:1.75;margin:0 0 36px;max-width:600px;font-family:'DM Sans',sans-serif}
        .fs-prog-wrap{height:3px;background:#1e1e24;border-radius:2px;overflow:hidden}
        .fs-prog{height:100%;border-radius:2px;animation:fsProg 3.8s linear both}
        @keyframes fsProg{from{width:0%}to{width:100%}}
        .fs-dots{display:flex;gap:7px;justify-content:center;margin-top:22px}
        .fs-dot{height:6px;width:6px;border-radius:3px;background:#26262e;border:none;cursor:pointer;transition:all .2s ease;padding:0}
        @media(max-width:768px){.fs-tab-lbl{display:none}.fs-tab{padding:8px 12px}.fs-panel-inner{padding:36px 24px}.fs-big-num{font-size:64px;right:20px}.fs-title{font-size:24px}.fs-desc{font-size:14px}}
      `}</style>
    </div>
  );
}

/* ══ FAQ accordion ══ */
const FAQS = [
  { q: "Is HackathonHQ free to use?", a: "Yes — completely free for participants. Create an account, join hackathons, form teams, and submit projects at no cost. Organizers who want to host events with premium tools can talk to us." },
  { q: "How do teams work?", a: "You can either create a team and invite others by username, or browse open teams and request to join. Teams can have 1–8 members depending on the event rules." },
  { q: "How is judging done?", a: "Judges are assigned to events by organizers. Each judge scores submissions on structured criteria — innovation, execution, design, and impact — and leaves written feedback visible to the team after results." },
  { q: "Can I organize my own hackathon?", a: "Absolutely. Create an event, set the dates, prize pool, team size limits, and judging criteria. You get a full organizer dashboard to manage teams, submissions, and announce results." },
  { q: "What happens after I win?", a: "Your profile gets a permanent winner badge, your submission is highlighted in the Results feed, and top performers appear in our talent spotlight which is distributed to our hiring partners." },
  { q: "Is my submitted code kept private?", a: "You control visibility. Mark your repo public or private. Only judges assigned to your event can see your submission details during the judging window." },
];

function FAQAccordion() {
  const [open, setOpen] = useState(null);
  return (
    <div className="faq">
      {FAQS.map((f, i) => (
        <SlideUp key={i} delay={i * 0.07}>
          <div className={`faq-item${open === i ? " faq-item-open" : ""}`}>
            <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
              <span>{f.q}</span>
              <span className="faq-icon">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <div className="faq-a">{f.a}</div>}
          </div>
        </SlideUp>
      ))}
      <style jsx>{`
        .faq{display:flex;flex-direction:column;gap:8px}
        .faq-item{background:#111114;border:1px solid #1e1e24;border-radius:14px;overflow:hidden;transition:border-color .2s}
        .faq-item:hover{border-color:#26262e}
        .faq-item-open{border-color:rgba(110,231,183,.25)}
        .faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;background:transparent;border:none;color:#f0f0f3;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;text-align:left}
        .faq-q:hover{color:#6EE7B7}
        .faq-item-open .faq-q{color:#6EE7B7}
        .faq-icon{font-size:20px;font-weight:300;color:#6EE7B7;flex-shrink:0;line-height:1}
        .faq-a{padding:0 24px 20px;font-size:14px;color:#5c5c6e;line-height:1.75;font-family:'DM Sans',sans-serif;border-top:1px solid #1e1e24;padding-top:16px;margin-top:-4px}
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  useEffect(() => { if (!loading && user) router.push("/dashboard"); }, [user, loading, router]);
  useEffect(() => {
    const onMouse = (e) => setMouse({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  if (loading) return <LoadingSpinner message="Loading..." />;
  if (user) return null;

  const TICKER_ITEMS = ["AI Hackathon 2026", "Web3 BuildWeek", "Open Source Sprint", "Climate Tech Challenge", "Mobile Dev Jam", "DeFi Hackathon", "Health AI Challenge", "Gaming & XR Build", "EdTech Sprint", "Fintech Forge", "Robotics Open", "Cybersecurity CTF"];

  return (
    <div className="ll">

      {/* ═══════════ HERO ═══════════ */}
      <section className="ll-hero">
        <ParticleMesh count={90} />
        <div className="ll-orb ll-orb1" style={{ left: `${28 + (mouse.x - 50) * .07}%`, top: `${32 + (mouse.y - 50) * .05}%` }} />
        <div className="ll-orb ll-orb2" style={{ left: `${62 + (mouse.x - 50) * .04}%`, top: `${55 + (mouse.y - 50) * .06}%` }} />
        <div className="ll-orb ll-orb3" style={{ left: `${12 + (mouse.x - 50) * .03}%`, top: `${68 + (mouse.y - 50) * .04}%` }} />
        <div className="ll-grain" />

        <div className="ll-wrap ll-hero-wrap">
          <div className="ll-hero-grid">
            {/* Copy */}
            <div className="ll-copy">
              <div className="ll-ey ll-a1">
                <span className="ll-eydot" />
                <span>The Hackathon Platform</span>
                <span className="ll-eybadge">2026</span>
              </div>
              <h1 className="ll-h1 ll-a2">
  <span className="ll-h1-row">Build.</span>
  <span className="ll-h1-row ll-h1-indent">Compete.</span>
  <span className="ll-h1-row ll-h1-glow">Win together.</span>
</h1>
              <p className="ll-sub ll-a3">The complete hackathon stack — events, teams, submissions, expert judging, and a live community feed. Everything in one place.</p>
              <div className="ll-btns ll-a4">
                <button className="ll-cta-btn" onClick={() => router.push("/register")}>
                  <span className="ll-cta-bg" />
                  <span className="ll-cta-txt">
                    Get started free
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </span>
                </button>
                <button className="ll-ghost-btn" onClick={() => router.push("/login")}>Sign in →</button>
              </div>
              <p className="ll-fine ll-a4">Free forever · No card needed · Start in 30 seconds</p>
              <div className="ll-mini-stats ll-a4">
                {[["500+", "Events"], ["10k+", "Builders"], ["$2M+", "In prizes"]].map(([v, l]) => (
                  <div key={l} className="ll-ms">
                    <span className="ll-ms-v">{v}</span>
                    <span className="ll-ms-l">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="ll-mockup ll-a3">
              <TiltCard className="ll-dash">
                <div className="ll-dash-chrome">
                  <div className="ll-dots"><span /><span /><span /></div>
                  <span className="ll-chrome-lbl">hackathonhq.dev · AI Hackathon 2026</span>
                  <span className="ll-live-pill"><span className="ll-live-dot" />LIVE</span>
                </div>
                <div className="ll-dash-body">
                  <div className="ll-dash-stats">
                    {[["24", "Teams"], ["3d", "Left"], ["$12k", "Prize"], ["89%", "Done"]].map(([v, l]) => (
                      <div key={l} className="ll-dstat"><span className="ll-dstat-v">{v}</span><span className="ll-dstat-l">{l}</span></div>
                    ))}
                  </div>
                  <div className="ll-prog-row"><span>Submission progress</span><span className="ll-prog-pct">68%</span></div>
                  <div className="ll-prog-track"><div className="ll-prog-fill" /></div>
                  <div className="ll-lb-hd">Live leaderboard</div>
                  {[{ rank: 1, name: "NeuralFlow", tech: "Python · TF", score: "9.4", up: true }, { rank: 2, name: "GridAI", tech: "React · Go", score: "8.9", up: true }, { rank: 3, name: "Syntax++", tech: "Rust · WASM", score: "8.7", up: false }].map(r => (
                    <div key={r.rank} className="ll-lb-row">
                      <span className="ll-lb-rank">#{r.rank}</span>
                      <div className="ll-lb-avi">{r.name[0]}</div>
                      <div className="ll-lb-info"><span className="ll-lb-name">{r.name}</span><span className="ll-lb-tech">{r.tech}</span></div>
                      <div className="ll-lb-right"><span className="ll-lb-score">{r.score}</span><span className="ll-lb-delta" style={{ color: r.up ? "#6EE7B7" : "#5c5c6e" }}>{r.up ? "+0.2" : "—"}</span></div>
                    </div>
                  ))}
                </div>
              </TiltCard>
              <div className="ll-badge ll-badge1"><span className="ll-badge-ico">🏆</span><div><div className="ll-badge-t">NeuralFlow wins!</div><div className="ll-badge-s">AI Hackathon 2025 · 1st</div></div></div>
              <div className="ll-badge ll-badge2"><div className="ll-badge-pips">{["A", "B", "C", "D"].map(x => <span key={x}>{x}</span>)}</div><span className="ll-badge-txt">Team of 4 formed</span></div>
              <div className="ll-badge ll-badge3"><span className="ll-badge-ico">⚡</span><div><div className="ll-badge-t">New submission</div><div className="ll-badge-s">GridAI · 2 min ago</div></div></div>
            </div>
          </div>
        </div>
        <div className="ll-hero-fade" />
      </section>

      {/* ═══════════ TICKER ═══════════ */}
      <Ticker items={TICKER_ITEMS} />

      {/* ═══════════ STATS ═══════════ */}
      <div className="ll-stats-band ll-stats-on">
        <div className="ll-wrap ll-stats-row">
          {[["500", "+", "Hackathons hosted"], ["10000", "+", "Active builders"], ["2500", "+", "Projects shipped"], ["150", "+", "Expert judges"]].map(([to, sx, lbl], i) => (
            <React.Fragment key={lbl}>
              <div className="ll-stat">
                <span className="ll-stat-n"><Counter to={parseInt(to)} suffix={sx} /></span>
                <span className="ll-stat-l">{lbl}</span>
              </div>
              {i < 3 && <div className="ll-stat-sep" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="ll-section" id="features">
        <div className="ll-wrap">
          <div className="ll-sec-hd">
            <SlideUp><div className="ll-ey"><span className="ll-eydot" /><span>Platform Features</span></div></SlideUp>
            <SlideUp delay={0.1}><h2 className="ll-h2">Built for builders who<br /><em className="ll-em">actually ship.</em></h2></SlideUp>
            <SlideUp delay={0.2}><p className="ll-h2-sub">Six core tools that take you from idea to winner's podium.</p></SlideUp>
          </div>
          <SlideUp delay={0.15}><FeatureSlideshow /></SlideUp>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="ll-section ll-alt-bg" id="how-it-works">
        <div className="ll-wrap">
          <div className="ll-sec-hd">
            <SlideUp><div className="ll-ey"><span className="ll-eydot" /><span>Process</span></div></SlideUp>
            <SlideUp delay={0.1}><h2 className="ll-h2">Zero to shipped<br /><em className="ll-em">in four steps.</em></h2></SlideUp>
          </div>
          <div className="ll-how-grid">
            {[
              { n: "01", title: "Sign up free", desc: "Create your account in 30 seconds. No card. Instant access to all live hackathons.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
              { n: "02", title: "Find your event", desc: "Filter by theme, prize, team size, or date. Bookmark events and get notified when they go live.", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { n: "03", title: "Build your team", desc: "Invite by username, set roles, and coordinate in the community feed before kickoff.", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
              { n: "04", title: "Ship & get judged", desc: "Submit before the deadline. Receive expert structured scoring and detailed feedback on every criterion.", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
            ].map((s, i) => (
              <SlideUp key={s.n} delay={i * 0.1}>
                <TiltCard className="ll-step">
                  <div className="ll-step-inner">
                    <div className="ll-step-top">
                      <div className="ll-step-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="1.75" width="22" height="22"><path d={s.icon} /></svg>
                      </div>
                      <span className="ll-step-n">{s.n}</span>
                    </div>
                    <h3 className="ll-step-title">{s.title}</h3>
                    <p className="ll-step-desc">{s.desc}</p>
                  </div>
                  {i < 3 && <div className="ll-step-arrow">→</div>}
                </TiltCard>
              </SlideUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ABOUT ═══════════ */}
      <section className="ll-section" id="about">
        <div className="ll-wrap">
          <div className="ll-about-wrap">
            <div className="ll-about-top">
              <div className="ll-about-copy">
                <SlideUp><div className="ll-ey"><span className="ll-eydot" /><span>About HackathonHQ</span></div></SlideUp>
                <SlideUp delay={0.1}><h2 className="ll-h2">We built the platform<br /><em className="ll-em">we always wanted.</em></h2></SlideUp>
                <SlideUp delay={0.2}><p className="ll-about-p">HackathonHQ started when a group of engineers got tired of hackathons being disorganized — judging was opaque, team formation was chaos, and there was nowhere to show off what you built.</p></SlideUp>
                <SlideUp delay={0.25}><p className="ll-about-p">So we built it ourselves. A platform where every part of the hackathon experience — discovery, teaming, submitting, judging, and celebrating — happens in one coherent place.</p></SlideUp>
              </div>
              <SlideUp delay={0.15}>
                <TiltCard className="ll-about-snap" intensity={6}>
                  <div className="ll-snap-header">
                    <span className="ll-snap-pill"><span className="ll-live-dot" />Platform activity</span>
                    <span className="ll-snap-time">Right now</span>
                  </div>
                  <div className="ll-snap-feed">
                    {[
                      { icon: "🚀", label: "NeuralFlow submitted their project", time: "2m ago", accent: "#6EE7B7" },
                      { icon: "👥", label: "Team GridBuilders formed — 4 members", time: "5m ago", accent: "#60a5fa" },
                      { icon: "🏆", label: "Climate AI Hack results announced", time: "12m ago", accent: "#fbbf24" },
                      { icon: "⚡", label: "New hackathon: Web3 Sprint goes live", time: "1h ago", accent: "#a78bfa" },
                      { icon: "💬", label: "Ahmad R. posted in AI Hackathon feed", time: "1h ago", accent: "#6EE7B7" },
                    ].map((item, i) => (
                      <div key={i} className="ll-snap-row">
                        <div className="ll-snap-icon" style={{ background: `${item.accent}12`, border: `1px solid ${item.accent}20` }}>
                          <span>{item.icon}</span>
                        </div>
                        <span className="ll-snap-label">{item.label}</span>
                        <span className="ll-snap-t">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </TiltCard>
              </SlideUp>
            </div>

            {/* Value pillars — 3 col full width */}
            <div className="ll-about-vals">
              {[
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: "Speed over process", desc: "We optimise for builders getting things done, not bureaucracy.", accent: "#6EE7B7" },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>, title: "Radical transparency", desc: "Judges see your work clearly. You see your scores clearly. No surprises.", accent: "#60a5fa" },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>, title: "Globally accessible", desc: "Free for every hacker, everywhere. Opportunity shouldn't have a paywall.", accent: "#a78bfa" },
              ].map((v, i) => (
                <SlideUp key={v.title} delay={i * 0.1}>
                  <div className="ll-about-val" style={{ borderColor: `${v.accent}30` }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "0 2px 2px 0", background: v.accent, opacity: .8 }} />
                    <div className="ll-about-val-icon-wrap" style={{ background: `${v.accent}12`, border: `1px solid ${v.accent}22`, color: v.accent }}>{v.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ll-about-val-title" style={{ color: v.accent }}>{v.title}</div>
                      <div className="ll-about-val-desc">{v.desc}</div>
                    </div>
                  </div>
                </SlideUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PROOF ═══════════ */}
      <div className="ll-proof-band">
        <div className="ll-wrap ll-proof-inner">
          <SlideUp><p className="ll-proof-lbl">Engineers from these companies hack here</p></SlideUp>
          <div className="ll-proof-logos">
            {["Google", "Stripe", "Vercel", "OpenAI", "Anthropic", "GitHub", "Linear", "Figma", "Shopify", "Notion"].map((c, i) => (
              <SlideUp key={c} delay={i * 0.04} style={{ display: "inline-block" }}>
                <span className="ll-proof-co">{c}</span>
              </SlideUp>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ FOR EVERYONE ═══════════ */}
      <section className="ll-section ll-alt-bg">
        <div className="ll-wrap">
          <div className="ll-sec-hd">
            <SlideUp><div className="ll-ey"><span className="ll-eydot" /><span>For Everyone</span></div></SlideUp>
            <SlideUp delay={0.1}><h2 className="ll-h2">Whether you build or<br /><em className="ll-em">you run the show.</em></h2></SlideUp>
          </div>
          <div className="ll-roles-grid">
            {[
              { role: "For Hackers", color: "#6EE7B7", desc: "Everything you need to compete, connect, and grow your career through hackathons.", perks: ["Browse & join events", "Build or join teams", "Submit projects with full detail", "Receive expert judge feedback", "Community feed + DMs", "Public winner badges & portfolio"], cta: "Join as a hacker" },
              { role: "For Organizers", color: "#60a5fa", desc: "Powerful event management tools that let you focus on the experience, not the logistics.", perks: ["Create unlimited events", "Custom judging criteria & scoring", "Full participant management", "Automated result announcements", "Organizer analytics dashboard", "Dedicated support & community"], cta: "Organize an event" },
              { role: "For Judges", color: "#a78bfa", desc: "A structured, efficient judging workflow that's fair to every team and easy to complete.", perks: ["Dedicated judge dashboard", "Structured scoring rubrics", "Written + numerical feedback tools", "Score comparison & normalization", "See all submissions in one view", "Direct communication with organizers"], cta: "Become a judge" },
            ].map((r, i) => (
              <SlideUp key={r.role} delay={i * 0.12}>
                <TiltCard className="ll-role-card" intensity={8}>
                  <div className="ll-role-top" style={{ background: `linear-gradient(135deg, ${r.color}12, transparent)`, borderBottom: `1px solid ${r.color}20` }}>
                    <h3 className="ll-role-title" style={{ color: r.color }}>{r.role}</h3>
                    <p className="ll-role-desc">{r.desc}</p>
                  </div>
                  <div className="ll-role-body">
                    <ul className="ll-role-perks">
                      {r.perks.map(p => (
                        <li key={p} className="ll-role-perk">
                          <svg viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
                          {p}
                        </li>
                      ))}
                    </ul>
                    <button className="ll-role-btn" style={{ background: `${r.color}15`, border: `1px solid ${r.color}30`, color: r.color }} onClick={() => router.push("/register")}>
                      {r.cta} →
                    </button>
                  </div>
                </TiltCard>
              </SlideUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="ll-section">
        <div className="ll-wrap">
          <div className="ll-sec-hd">
            <SlideUp><div className="ll-ey"><span className="ll-eydot" /><span>Community</span></div></SlideUp>
            <SlideUp delay={0.1}><h2 className="ll-h2">From hackers who<br /><em className="ll-em">love this platform.</em></h2></SlideUp>
          </div>
          <div className="ll-testi-grid">
            {[
              { q: "Landed my first SWE role straight from a hackathon I found here. The judging feedback alone was worth it.", by: "Ahmad R.", role: "Software Engineer, Google", stars: 5 },
              { q: "Best platform I've used. Team tools, feed, DMs — everything you need to actually collaborate.", by: "Priya K.", role: "Product Designer, Stripe", stars: 5 },
              { q: "Won two hackathons in 6 months. The community is what makes it genuinely different.", by: "Léa M.", role: "Full Stack Dev, Vercel", stars: 5 },
              { q: "The submission flow and judge feedback system are light-years ahead of anything else out there.", by: "James O.", role: "ML Engineer, OpenAI", stars: 5 },
              { q: "Formed a team of strangers, built something real, got hired at the same company. No joke.", by: "Sara N.", role: "Frontend Dev, Linear", stars: 5 },
              { q: "I've organised 12 hackathons on this platform. The organizer dashboard is incredibly powerful.", by: "Rami A.", role: "Tech Lead & Organizer", stars: 5 },
            ].map((t, i) => (
              <SlideUp key={i} delay={i * 0.08}>
                <TiltCard className="ll-tcard">
                  <div className="ll-tcard-stars">{"★".repeat(t.stars)}</div>
                  <p className="ll-tcard-q">"{t.q}"</p>
                  <div className="ll-tcard-by">
                    <div className="ll-tcard-avi">{t.by[0]}</div>
                    <div><div className="ll-tcard-name">{t.by}</div><div className="ll-tcard-role">{t.role}</div></div>
                  </div>
                </TiltCard>
              </SlideUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="ll-section ll-cta-section">
        <div className="ll-wrap">
          <div className="ll-cta-box">
            <ParticleMesh count={60} />
            <div className="ll-cta-orb1" /><div className="ll-cta-orb2" />
            <div className="ll-cta-content">
              <SlideUp><div className="ll-ey ll-ey-c"><span className="ll-eydot" /><span>Get started</span></div></SlideUp>
              <SlideUp delay={0.1}><h2 className="ll-cta-h2">Your next big idea<br /><em className="ll-em">starts at a hackathon.</em></h2></SlideUp>
              <SlideUp delay={0.2}><p className="ll-cta-sub">Join thousands of developers, designers, and builders competing, shipping, and getting hired every single weekend. It's free.</p></SlideUp>
              <SlideUp delay={0.3}>
                <div className="ll-cta-btns">
                  <button className="ll-cta-btn ll-cta-btn-xl" onClick={() => router.push("/register")}>
                    <span className="ll-cta-bg" />
                    <span className="ll-cta-txt">
                      Create your free account
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                  </button>
                  <button className="ll-cta-secondary" onClick={() => router.push("/login")}>Already a member? Sign in</button>
                </div>
              </SlideUp>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="ll-section ll-alt-bg">
        <div className="ll-wrap">
          <div className="ll-sec-hd">
            <SlideUp><div className="ll-ey"><span className="ll-eydot" /><span>FAQ</span></div></SlideUp>
            <SlideUp delay={0.1}><h2 className="ll-h2">Common questions,<br /><em className="ll-em">straight answers.</em></h2></SlideUp>
          </div>
          <div className="ll-faq-wrap">
            <FAQAccordion />
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="ll-footer">
        <div className="ll-wrap">
          <SlideUp>
            <div className="ll-footer-top">
              <div className="ll-footer-brand">
                <span className="ll-footer-logo">HackathonHQ</span>
                <p className="ll-footer-tagline">The hackathon platform for builders who ship.</p>
              </div>
              <div className="ll-footer-cols">
                <div className="ll-fcol">
                  <div className="ll-fcol-hd">Platform</div>
                  {["Events", "Teams", "Submissions", "Community", "Leaderboard"].map(l => (
                    <button key={l} className="ll-fcol-link" onClick={() => router.push(`/${l.toLowerCase()}`)}>{l}</button>
                  ))}
                </div>
                <div className="ll-fcol">
                  <div className="ll-fcol-hd">Company</div>
                  {[["About", "#about"], ["Blog", "/blog"], ["Careers", "/careers"], ["Press", "/press"]].map(([l, h]) => (
                    <button key={l} className="ll-fcol-link" onClick={() => { if (h.startsWith("#")) { document.querySelector(h)?.scrollIntoView({ behavior: "smooth" }); } else { router.push(h); } }}>{l}</button>
                  ))}
                </div>
                <div className="ll-fcol">
                  <div className="ll-fcol-hd">Legal</div>
                  {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"], ["Status", "/status"]].map(([l, h]) => (
                    <button key={l} className="ll-fcol-link" onClick={() => router.push(h)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </SlideUp>
          <SlideUp delay={0.1}>
            <div className="ll-footer-btm">
              <span className="ll-footer-copy">© 2026 HackathonHQ. All rights reserved.</span>
              <div className="ll-footer-social">
                {["Twitter", "GitHub", "Discord"].map(s => (
                  <button key={s} className="ll-social-btn">{s}</button>
                ))}
              </div>
            </div>
          </SlideUp>
        </div>
      </footer>

      {/* ═══════════ GLOBAL KEYFRAMES ═══════════ */}
      <style jsx global>{`
        @keyframes float1{0%,100%{transform:translateY(0) translateX(0)}33%{transform:translateY(-20px) translateX(10px)}66%{transform:translateY(10px) translateX(-14px)}}
        @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-28px)}}
        @keyframes float3{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(14px) scale(1.04)}}
        @keyframes grainAni{0%,100%{transform:translate(0,0)}10%{transform:translate(-2%,-3%)}20%{transform:translate(3%,2%)}30%{transform:translate(-1%,4%)}40%{transform:translate(4%,-1%)}50%{transform:translate(-3%,3%)}60%{transform:translate(2%,-4%)}70%{transform:translate(-4%,1%)}80%{transform:translate(3%,-2%)}90%{transform:translate(-2%,3%)}}
        @keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(110,231,183,.4)}50%{opacity:.6;box-shadow:0 0 0 6px rgba(110,231,183,0)}}
        @keyframes dashProg{from{width:0}to{width:68%}}
        @keyframes badgeIn1{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes badgeIn2{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes badgeIn3{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes badgeFlt1{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes badgeFlt2{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes badgeFlt3{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <style jsx>{`
        .ll{min-height:100vh;background:#0c0c0f;color:#f0f0f3;font-family:'DM Sans',sans-serif;overflow-x:hidden}
        .ll-wrap{max-width:1200px;margin:0 auto;padding:0 40px}
        .ll-section{padding:120px 0}
        .ll-alt-bg{background:#111114;border-top:1px solid #1e1e24;border-bottom:1px solid #1e1e24}

        /* Eyebrow */
        .ll-ey{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6EE7B7;margin-bottom:18px}
        .ll-ey-c{display:flex;justify-content:center}
        .ll-eydot{width:6px;height:6px;border-radius:50%;background:#6EE7B7;flex-shrink:0;animation:pulse 2.5s ease-in-out infinite}
        .ll-eybadge{padding:2px 8px;border-radius:100px;font-size:9px;background:rgba(110,231,183,.12);border:1px solid rgba(110,231,183,.2);color:#6EE7B7}

        /* Hero entrance */
        .ll-a1{animation:revealUpHero .7s cubic-bezier(.16,1,.3,1) .1s both}
        .ll-a2{animation:revealUpHero .7s cubic-bezier(.16,1,.3,1) .22s both}
        .ll-a3{animation:revealUpHero .7s cubic-bezier(.16,1,.3,1) .36s both}
        .ll-a4{animation:revealUpHero .7s cubic-bezier(.16,1,.3,1) .5s both}
        @keyframes revealUpHero{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:translateY(0)}}

        /* Typography - Matching Teams Page */
         .ll-h1{font-family:'Syne';font-size:70px;font-weight:700;line-height:1.0;letter-spacing:-5px;margin:0 0 24px;color:#f0f0f3}
        .ll-h1-row{display:block}
        .ll-h1-indent{padding-left:36px}
        .ll-h1-glow{background:linear-gradient(125deg,#6EE7B7 0%,#4db896 40%,#a7f3d0 70%,#6EE7B7 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:200% 200%;animation:shimmer 4s ease-in-out infinite}
        .ll-h2{font-family:'Syne',sans-serif;font-size:44px;font-weight:700;color:#f0f0f3;margin:0 0 16px;letter-spacing:-1px;line-height:1.1}
        .ll-em{font-style:normal;color:#6EE7B7}
        .ll-h2-sub{font-size:16px;color:#5c5c6e;margin:0;line-height:1.7;max-width:520px;font-family:'DM Sans',sans-serif}
        .ll-sec-hd{margin-bottom:60px}
        .ll-about-p{font-size:15px;color:#5c5c6e;line-height:1.7;margin:0 0 16px;font-family:'DM Sans',sans-serif}
        .ll-sub{font-size:16px;color:#5c5c6e;line-height:1.7;margin:0 0 36px;max-width:480px;font-family:'DM Sans',sans-serif}
        .ll-step-title{font-family:'Syne',sans-serif;font-size:15.5px;font-weight:700;color:#f0f0f3;margin:0 0 10px;letter-spacing:-.2px}
        .ll-step-desc{font-size:13.5px;color:#5c5c6e;line-height:1.68;margin:0;font-family:'DM Sans',sans-serif}
        .ll-role-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;letter-spacing:-.4px;margin:0 0 10px}
        .ll-role-desc{font-size:13.5px;color:#5c5c6e;line-height:1.65;margin:0;font-family:'DM Sans',sans-serif}
        .ll-cta-h2{font-family:'Syne',sans-serif;font-size:48px;font-weight:700;color:#f0f0f3;margin:0 0 20px;letter-spacing:-1.5px;line-height:1.1}
        .ll-cta-sub{font-size:16px;color:#5c5c6e;line-height:1.7;margin:0 0 40px;max-width:520px;margin-left:auto;margin-right:auto;font-family:'DM Sans',sans-serif}
        .ll-footer-logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#f0f0f3;display:block;margin-bottom:10px;letter-spacing:-.5px}
        .ll-footer-tagline{font-size:13.5px;color:#5c5c6e;line-height:1.6;margin:0;font-family:'DM Sans',sans-serif}
        .ll-tcard-name{font-size:13px;font-weight:600;color:#f0f0f3;margin-bottom:1px;font-family:'DM Sans',sans-serif}
        .ll-tcard-role{font-size:11.5px;color:#5c5c6e;font-family:'DM Sans',sans-serif}
        .ll-tcard-q{font-size:13.5px;color:#a0a0b0;line-height:1.68;margin:0 0 18px;font-style:italic;font-family:'DM Sans',sans-serif}
        .ll-fcol-hd{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#f0f0f3;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
        .ll-fcol-link{background:transparent;border:none;color:#5c5c6e;font-size:13.5px;font-family:'DM Sans',sans-serif;cursor:pointer;text-align:left;padding:0;transition:color .15s;line-height:1.5}
        .ll-fcol-link:hover{color:#6EE7B7}
        .ll-proof-co{font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;color:#3a3a48;transition:color .2s;cursor:default;letter-spacing:-.2px}
        .ll-proof-co:hover{color:#5c5c6e}
        .ll-stat-n{display:block;font-family:'Syne',sans-serif;font-size:40px;font-weight:700;letter-spacing:-2px;margin-bottom:6px;background:linear-gradient(135deg,#f0f0f3 40%,#6EE7B7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .ll-ms-v{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#f0f0f3;letter-spacing:-.5px;line-height:1}
        .ll-dstat-v{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:#6EE7B7;letter-spacing:-.5px;margin-bottom:2px}
        .ll-lb-score{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#6EE7B7}

        /* Buttons */
        .ll-cta-btn{position:relative;display:inline-flex;align-items:center;padding:14px 30px;border-radius:100px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14.5px;font-weight:600;overflow:hidden;transition:transform .2s,box-shadow .2s}
        .ll-cta-btn:hover{transform:translateY(-3px);box-shadow:0 18px 44px rgba(110,231,183,.38)}
        .ll-cta-bg{position:absolute;inset:0;border-radius:100px;background:linear-gradient(125deg,#6EE7B7 0%,#4db896 50%,#86efac 100%);background-size:200% 200%;animation:shimmer 3s ease-in-out infinite}
        .ll-cta-txt{position:relative;z-index:1;color:#0c0c0f;display:flex;align-items:center;gap:8px}
        .ll-cta-btn-xl{padding:16px 36px;font-size:16px}
        .ll-ghost-btn{display:inline-flex;align-items:center;padding:14px 28px;background:transparent;border:1px solid #26262e;border-radius:100px;color:#f0f0f3;font-size:14px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
        .ll-ghost-btn:hover{border-color:rgba(110,231,183,.4);color:#6EE7B7}
        .ll-cta-secondary{background:transparent;border:1px solid #26262e;border-radius:100px;color:#5c5c6e;font-size:14px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;padding:12px 24px;transition:all .2s}
        .ll-cta-secondary:hover{color:#888}
        .ll-role-btn{width:100%;padding:11px;border-radius:10px;font-size:13.5px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
        .ll-role-btn:hover{filter:brightness(1.2)}
        .ll-social-btn{padding:7px 14px;background:transparent;border:1px solid #1e1e24;border-radius:8px;color:#5c5c6e;font-size:12.5px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s}
        .ll-social-btn:hover{border-color:#26262e;color:#f0f0f3}

        /* Hero */
        .ll-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;overflow:hidden}
        .ll-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;transition:left .4s ease,top .4s ease}
        .ll-orb1{width:600px;height:600px;background:radial-gradient(circle,rgba(110,231,183,.12) 0%,transparent 70%);animation:float1 12s ease-in-out infinite}
        .ll-orb2{width:400px;height:400px;background:radial-gradient(circle,rgba(96,165,250,.08) 0%,transparent 70%);animation:float2 9s ease-in-out infinite 2s}
        .ll-orb3{width:320px;height:320px;background:radial-gradient(circle,rgba(167,139,250,.07) 0%,transparent 70%);animation:float3 14s ease-in-out infinite 4s}
        .ll-grain{position:absolute;inset:-50%;width:200%;height:200%;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");opacity:.4;pointer-events:none;animation:grainAni .5s steps(1) infinite}
        .ll-hero-wrap{position:relative;z-index:1;padding:88px 40px 100px}
        .ll-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
        .ll-btns{display:flex;gap:14px;align-items:center;margin-bottom:16px}
        .ll-fine{font-size:12px;color:#3a3a48;margin:0 0 32px}
        .ll-mini-stats{display:flex;gap:28px;padding-top:24px;border-top:1px solid #1e1e24}
        .ll-ms{display:flex;flex-direction:column;gap:2px}
        .ll-ms-l{font-size:11px;color:#3a3a48;text-transform:uppercase;letter-spacing:.5px;font-family:'DM Sans',sans-serif}

        /* Dashboard mockup */
        .ll-mockup{position:relative}
        .ll-dash{background:#111114;border:1px solid #1e1e24;border-radius:20px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(110,231,183,.05)}
        .ll-dash-chrome{display:flex;align-items:center;gap:10px;padding:12px 18px;background:#0c0c0f;border-bottom:1px solid #1e1e24}
        .ll-dots{display:flex;gap:6px}
        .ll-dots span{width:11px;height:11px;border-radius:50%}
        .ll-dots span:nth-child(1){background:#f87171}.ll-dots span:nth-child(2){background:#fbbf24}.ll-dots span:nth-child(3){background:#4ade80}
        .ll-chrome-lbl{flex:1;text-align:center;font-size:11px;color:#5c5c6e;font-family:'DM Sans',sans-serif}
        .ll-live-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:100px;font-size:9.5px;font-weight:700;background:rgba(110,231,183,.1);color:#6EE7B7;border:1px solid rgba(110,231,183,.2);letter-spacing:.5px;font-family:'DM Sans',sans-serif}
        .ll-live-dot{width:5px;height:5px;border-radius:50%;background:#6EE7B7;animation:pulse 1.8s infinite}
        .ll-dash-body{padding:18px}
        .ll-dash-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#1e1e24;border:1px solid #1e1e24;border-radius:10px;overflow:hidden;margin-bottom:16px}
        .ll-dstat{background:#0c0c0f;padding:10px 12px;text-align:center}
        .ll-dstat-l{font-size:9px;color:#5c5c6e;text-transform:uppercase;letter-spacing:.4px;font-family:'DM Sans',sans-serif}
        .ll-prog-row{display:flex;justify-content:space-between;font-size:11px;color:#5c5c6e;margin-bottom:5px;font-family:'DM Sans',sans-serif}
        .ll-prog-pct{color:#6EE7B7;font-weight:600}
        .ll-prog-track{height:4px;background:#1e1e24;border-radius:2px;overflow:hidden;margin-bottom:16px}
        .ll-prog-fill{height:100%;background:linear-gradient(90deg,#6EE7B7,#4db896);border-radius:2px;animation:dashProg 1.6s cubic-bezier(.16,1,.3,1) .8s both}
        .ll-lb-hd{font-size:10px;font-weight:600;color:#3a3a48;text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px;font-family:'DM Sans',sans-serif}
        .ll-lb-row{display:flex;align-items:center;gap:9px;padding:8px 10px;background:#0c0c0f;border-radius:8px;border:1px solid #1e1e24;margin-bottom:5px;transition:border-color .15s}
        .ll-lb-row:hover{border-color:rgba(110,231,183,.2)}.ll-lb-row:last-child{margin-bottom:0}
        .ll-lb-rank{font-size:10px;font-weight:700;color:#3a3a48;min-width:18px;font-family:'DM Sans',sans-serif}
        .ll-lb-avi{width:24px;height:24px;border-radius:6px;background:rgba(110,231,183,.1);border:1px solid rgba(110,231,183,.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:#6EE7B7;flex-shrink:0}
        .ll-lb-name{display:block;font-size:11.5px;font-weight:600;color:#f0f0f3;font-family:'DM Sans',sans-serif}
        .ll-lb-tech{font-size:9.5px;color:#5c5c6e;font-family:'DM Sans',sans-serif}
        .ll-lb-delta{font-size:9.5px;font-weight:600;font-family:'DM Sans',sans-serif}

        /* Floating badges */
        .ll-badge{position:absolute;display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:13px;backdrop-filter:blur(12px);box-shadow:0 12px 40px rgba(0,0,0,.6)}
        .ll-badge1{bottom:-16px;left:-28px;background:linear-gradient(135deg,#111114,rgba(251,191,36,.07));border:1px solid rgba(251,191,36,.25);animation:badgeIn1 .6s .9s both,badgeFlt1 8s ease-in-out infinite 1.5s}
        .ll-badge2{top:-14px;right:-16px;background:#111114;border:1px solid #26262e;animation:badgeIn2 .6s 1.1s both,badgeFlt2 6s ease-in-out infinite 1.7s}
        .ll-badge3{top:46%;right:-26px;background:linear-gradient(135deg,#111114,rgba(96,165,250,.07));border:1px solid rgba(96,165,250,.2);animation:badgeIn3 .6s 1.3s both,badgeFlt3 10s ease-in-out infinite 2s}
        .ll-badge-ico{font-size:20px;flex-shrink:0}
        .ll-badge-pips{display:flex}
        .ll-badge-pips span{width:22px;height:22px;border-radius:50%;background:rgba(110,231,183,.1);border:2px solid #0c0c0f;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#6EE7B7;margin-left:-5px;font-family:'Syne',sans-serif}
        .ll-badge-pips span:first-child{margin-left:0}
        .ll-badge-t{font-size:11.5px;font-weight:600;color:#f0f0f3;margin-bottom:1px;font-family:'Syne',sans-serif}
        .ll-badge-s{font-size:10px;color:#5c5c6e;font-family:'DM Sans',sans-serif}
        .ll-badge-txt{font-size:11.5px;font-weight:600;color:#f0f0f3;white-space:nowrap;font-family:'DM Sans',sans-serif}
        .ll-hero-fade{position:absolute;bottom:0;left:0;right:0;height:150px;background:linear-gradient(to bottom,transparent,#0c0c0f);pointer-events:none;z-index:1}

        /* Stats band */
        .ll-stats-band{border-top:1px solid #1e1e24;border-bottom:1px solid #1e1e24;background:#111114;padding:44px 0;opacity:0;transform:translateY(20px);transition:opacity .7s ease,transform .7s ease}
        .ll-stats-on{opacity:1;transform:translateY(0)}
        .ll-stats-row{display:flex;align-items:center;justify-content:space-between}
        .ll-stat{text-align:center;flex:1}
        .ll-stat-l{font-size:11.5px;color:#5c5c6e;text-transform:uppercase;letter-spacing:.7px;font-family:'DM Sans',sans-serif}
        .ll-stat-sep{width:1px;height:36px;background:#1e1e24;flex-shrink:0}

        /* How it works */
        .ll-how-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;position:relative}
        .ll-step{background:#0c0c0f;border:1px solid #1e1e24;border-radius:16px;transition:border-color .2s;cursor:default;position:relative;height:100%}
        .ll-step:hover{border-color:rgba(110,231,183,.25)}
        .ll-step-inner{padding:28px 24px}
        .ll-step-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .ll-step-icon{width:44px;height:44px;border-radius:12px;background:rgba(110,231,183,.08);border:1px solid rgba(110,231,183,.15);display:flex;align-items:center;justify-content:center}
        .ll-step-n{font-size:11px;font-weight:600;color:#3a3a48;letter-spacing:.5px;font-family:'DM Sans',sans-serif}
        .ll-step-arrow{position:absolute;top:50%;right:-22px;transform:translateY(-50%);color:#3a3a48;font-size:16px;z-index:2}

        /* About */
        .ll-about-wrap{display:flex;flex-direction:column;gap:40px}
        .ll-about-top{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
        .ll-about-vals{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .ll-about-val{display:flex;align-items:center;gap:16px;padding:18px 20px 18px 24px;background:#111114;border:1px solid #1e1e24;border-radius:14px;position:relative;overflow:hidden;transition:background .15s,border-color .2s,transform .15s;height:100%}
        .ll-about-val:hover{background:#17171b;transform:translateX(4px)}
        .ll-about-val-icon-wrap{width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .ll-about-val-title{font-size:14.5px;font-weight:600;margin-bottom:3px;font-family:'Syne',sans-serif;letter-spacing:-.2px;line-height:1.2}
        .ll-about-val-desc{font-size:13px;color:#5c5c6e;line-height:1.55;margin:0;font-family:'DM Sans',sans-serif}

        /* Activity snap */
        .ll-about-snap{background:#111114;border:1px solid #1e1e24;border-radius:18px;overflow:hidden;cursor:default}
        .ll-snap-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#0c0c0f;border-bottom:1px solid #1e1e24}
        .ll-snap-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#6EE7B7;text-transform:uppercase;letter-spacing:.8px;font-family:'DM Sans',sans-serif}
        .ll-snap-time{font-size:11px;color:#3a3a48;font-family:'DM Sans',sans-serif}
        .ll-snap-feed{padding:8px 0}
        .ll-snap-row{display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid #1e1e24;transition:background .12s}
        .ll-snap-row:last-child{border-bottom:none}
        .ll-snap-row:hover{background:#17171b}
        .ll-snap-icon{width:32px;height:32px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px}
        .ll-snap-label{flex:1;font-size:12.5px;color:#a0a0b0;font-family:'DM Sans',sans-serif}
        .ll-snap-t{font-size:11px;color:#3a3a48;white-space:nowrap;flex-shrink:0;font-family:'DM Sans',sans-serif}

        /* Proof */
        .ll-proof-band{padding:40px 0;border-bottom:1px solid #1e1e24}
        .ll-proof-inner{display:flex;align-items:center;gap:40px;flex-wrap:wrap}
        .ll-proof-lbl{font-size:11px;color:#3a3a48;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;flex-shrink:0;margin:0;font-family:'DM Sans',sans-serif}

        /* Roles */
        .ll-roles-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .ll-role-card{background:#0c0c0f;border:1px solid #1e1e24;border-radius:18px;overflow:hidden;cursor:default;transition:border-color .2s;height:100%}
        .ll-role-card:hover{border-color:rgba(110,231,183,.2)}
        .ll-role-top{padding:28px 24px 20px}
        .ll-role-body{padding:20px 24px 24px}
        .ll-role-perks{list-style:none;margin:0 0 20px;padding:0;display:flex;flex-direction:column;gap:10px}
        .ll-role-perk{display:flex;align-items:center;gap:9px;font-size:13.5px;color:#888;font-family:'DM Sans',sans-serif}

        /* Testimonials */
        .ll-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .ll-tcard{background:#111114;border:1px solid #1e1e24;border-radius:16px;padding:24px;cursor:default;transition:border-color .2s;height:100%}
        .ll-tcard:hover{border-color:rgba(110,231,183,.2)}
        .ll-tcard-stars{color:#fbbf24;font-size:13px;margin-bottom:12px;letter-spacing:2px}
        .ll-tcard-by{display:flex;align-items:center;gap:10px}
        .ll-tcard-avi{width:32px;height:32px;border-radius:50%;background:rgba(110,231,183,.1);border:1px solid rgba(110,231,183,.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#6EE7B7;flex-shrink:0}

        /* FAQ */
        .ll-faq-wrap{max-width:800px}

        /* CTA */
        .ll-cta-section{padding:120px 0}
        .ll-cta-box{position:relative;border-radius:28px;overflow:hidden;border:1px solid rgba(110,231,183,.15);background:linear-gradient(135deg,#111114 0%,rgba(110,231,183,.03) 100%);box-shadow:0 0 120px rgba(110,231,183,.07)}
        .ll-cta-orb1{position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(110,231,183,.1) 0%,transparent 70%);top:-100px;left:-100px;pointer-events:none;animation:float1 12s ease-in-out infinite}
        .ll-cta-orb2{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(96,165,250,.07) 0%,transparent 70%);bottom:-80px;right:-80px;pointer-events:none;animation:float2 9s ease-in-out infinite 3s}
        .ll-cta-content{position:relative;z-index:1;padding:80px;text-align:center}
        .ll-cta-h2{font-family:'Syne';font-size:48px;font-weight:700;color:#f0f0f3;margin:0 0 20px;letter-spacing:-2px;line-height:1.1}
        .ll-cta-sub{font-size:16px;color:#5c5c6e;line-height:1.7;margin:0 0 40px;max-width:520px;margin-left:auto;margin-right:auto}
        .ll-cta-btns{display:flex;flex-direction:column;align-items:center;gap:14px}

        /* Footer */
        .ll-footer{padding:64px 0 40px;border-top:1px solid #1e1e24;background:#0c0c0f}
        .ll-footer-top{display:grid;grid-template-columns:280px 1fr;gap:80px;margin-bottom:48px;padding-bottom:48px;border-bottom:1px solid #1e1e24}
        .ll-footer-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
        .ll-fcol{display:flex;flex-direction:column;gap:10px}
        .ll-footer-btm{display:flex;align-items:center;justify-content:space-between;gap:16px}
        .ll-footer-copy{font-size:12px;color:#3a3a48;font-family:'DM Sans',sans-serif}
        .ll-footer-social{display:flex;gap:8px}

        /* Responsive */
        @media(max-width:1100px){.ll-h1{font-size:56px}.ll-cta-h2{font-size:38px}.ll-cta-content{padding:60px 40px}.ll-footer-top{grid-template-columns:1fr;gap:40px}.ll-about-top{grid-template-columns:1fr;gap:40px}}
        @media(max-width:960px){.ll-hero-grid{grid-template-columns:1fr;gap:56px}.ll-hero-wrap{padding:60px 40px 80px}.ll-h1{font-size:52px}.ll-testi-grid{grid-template-columns:repeat(2,1fr)}.ll-how-grid{grid-template-columns:repeat(2,1fr)}.ll-roles-grid{grid-template-columns:1fr 1fr}.ll-step-arrow{display:none}.ll-badge{display:none}}
        @media(max-width:768px){.ll-wrap{padding:0 20px}.ll-hero-wrap{padding:48px 20px 72px}.ll-h1{font-size:40px;letter-spacing:-1px}.ll-h2{font-size:32px}.ll-cta-h2{font-size:28px}.ll-stats-row{flex-wrap:wrap;gap:28px;justify-content:center}.ll-stat-sep{display:none}.ll-testi-grid{grid-template-columns:1fr}.ll-how-grid{grid-template-columns:1fr}.ll-roles-grid{grid-template-columns:1fr}.ll-proof-inner{flex-direction:column;gap:16px;align-items:flex-start}.ll-cta-content{padding:48px 24px}.ll-section{padding:80px 0}.ll-footer-btm{flex-direction:column;gap:12px;text-align:center}.ll-footer-cols{grid-template-columns:repeat(3,1fr)}.ll-about-vals{grid-template-columns:1fr}}
        @media(max-width:480px){.ll-h1{font-size:32px}.ll-btns{flex-direction:column;align-items:stretch}.ll-cta-btn,.ll-ghost-btn{justify-content:center}.ll-mockup{width:100%}.ll-dash{width:100%}.ll-footer-cols{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
}
