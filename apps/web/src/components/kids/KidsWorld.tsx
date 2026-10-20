"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { catalog } from "@/lib/api";
import { getKidsDict } from "@/lib/dict/kids";
import { num, type Dict } from "@/lib/i18n";
import type { Course, Locale, Mentor } from "@/lib/types";
import { CourseCard } from "../CourseCard";
import { BGS, DEFAULT_LOOK, HAIRS, KidAvatar, OUTFITS, SKINS, type HeroLook } from "./KidAvatar";

type Project = { id: string; name: string; kind: string; idea: string };
type State = { look: HeroLook; nick: string; xp: number; streak: number; lastDay: string; missionsDay: string; done: string[]; projects: Project[]; cheered: string[]; saved: boolean };
const KEY = "gba.kids.v1";
const today = () => new Date().toISOString().slice(0, 10);
const fresh = (): State => ({ look: DEFAULT_LOOK, nick: "", xp: 0, streak: 0, lastDay: "", missionsDay: today(), done: [], projects: [], cheered: [], saved: false });
const EMOJI = ["⭐", "🚀", "🎉", "💡"];
const SAMPLE_HEROES: { nick: [string, string]; xp: number; look: HeroLook }[] = [
  { nick: ["النجم اللامع", "Shiny Star"], xp: 480, look: { skin: 2, hair: "spiky", hairColor: 3, outfit: 2, accessory: "crown", bg: 2, cape: true } },
  { nick: ["الصقر الصغير", "Little Falcon"], xp: 410, look: { skin: 0, hair: "short", hairColor: 1, outfit: 4, accessory: "glasses", bg: 4, cape: false } },
  { nick: ["مبدعة الفضاء", "Space Maker"], xp: 335, look: { skin: 3, hair: "bun", hairColor: 0, outfit: 5, accessory: "headphones", bg: 3, cape: true } },
  { nick: ["بطل الروبوت", "Robo Hero"], xp: 260, look: { skin: 1, hair: "curly", hairColor: 2, outfit: 1, accessory: "star", bg: 5, cape: false } },
  { nick: ["رحالة الأفكار", "Idea Rider"], xp: 190, look: { skin: 4, hair: "short", hairColor: 4, outfit: 3, accessory: "none", bg: 1, cape: true } },
];
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const KIND_EMOJI: Record<string, string> = { robot: "🤖", game: "🎮", story: "📖", art: "🎨", science: "🧪", app: "📱" };

export function KidsWorld({ locale, t }: { locale: Locale; t: Dict }) {
  const k = getKidsDict(locale);
  const [s, setS] = useState<State>(fresh);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [draft, setDraft] = useState({ name: "", kind: "robot", idea: "" });

  // Load the saved hero. Storage can be blocked, so every access is guarded. The daily login mission and the streak update here.
  useEffect(() => {
    let st = fresh();
    try { const raw = localStorage.getItem(KEY); if (raw) st = { ...st, ...JSON.parse(raw) }; } catch { /* private mode */ }
    const d = today();
    if (st.missionsDay !== d) { st.missionsDay = d; st.done = []; }
    if (st.lastDay !== d) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      st.streak = st.lastDay === y ? st.streak + 1 : 1;
      st.lastDay = d;
    }
    setS(st); setReady(true);
    catalog.courses({ audience: "kids" }).then(setCourses).catch(() => setCourses([]));
    catalog.mentors().then(setMentors).catch(() => setMentors([]));
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }, [s, ready]);

  const level = Math.min(5, Math.floor(s.xp / 100) + 1);
  const inLevel = level === 5 ? 100 : s.xp % 100;
  const look = s.look;
  const setLook = (p: Partial<HeroLook>) => setS((x) => ({ ...x, look: { ...x.look, ...p }, saved: false }));
  const earn = useCallback((id: string, xp: number) => setS((x) => (x.done.includes(id) ? x : { ...x, done: [...x.done, id], xp: x.xp + xp })), []);
  useEffect(() => { if (ready) earn("login", 10); }, [ready, earn]);

  const badges = useMemo(() => {
    const b: string[] = [];
    if (s.saved) b.push("first");
    if (s.projects.length > 0) b.push("project");
    if (s.streak >= 3) b.push("streak3");
    if (level >= 2) b.push("level2");
    if (s.cheered.length >= 5) b.push("cheers5");
    return b;
  }, [s.saved, s.projects.length, s.streak, level, s.cheered.length]);

  const saveHero = () => { setS((x) => ({ ...x, saved: true })); setMsg(k.builder.saved); setTimeout(() => setMsg(""), 2500); };
  const addProject = () => {
    if (!draft.name.trim()) return;
    const p: Project = { id: `p${Date.now()}`, name: draft.name.trim().slice(0, 40), kind: draft.kind, idea: draft.idea.trim().slice(0, 120) };
    setS((x) => ({ ...x, projects: [p, ...x.projects], xp: x.xp + 40, done: x.done.includes("project") ? x.done : [...x.done, "project"] }));
    setDraft({ name: "", kind: "robot", idea: "" });
  };
  const cheer = (id: string) => setS((x) => (x.cheered.includes(id) ? x : { ...x, cheered: [...x.cheered, id], xp: x.xp + 5, done: x.done.includes("share") ? x.done : [...x.done, "share"] }));
  const nick = s.nick.trim() || (locale === "ar" ? "بطلي" : "My Hero");

  const board = [...SAMPLE_HEROES.map((h) => ({ ...h, name: h.nick[locale === "ar" ? 0 : 1], me: false })), { nick: ["", ""] as [string, string], xp: s.xp, look, name: nick, me: true }].sort((a, b) => b.xp - a.xp);
  const mById = new Map(mentors.map((m) => [m.id, m]));

  const Swatches = ({ label, colors, value, onPick }: { label: string; colors: string[]; value: number; onPick: (i: number) => void }) => (
    <div><p className="mb-1.5 text-sm font-bold text-navy">{label}</p>
      <div className="flex flex-wrap gap-2">{colors.map((c, i) => <button key={c} type="button" onClick={() => onPick(i)} aria-label={`${label} ${i + 1}`} aria-pressed={value === i} className={`h-9 w-9 rounded-full border-2 transition ${value === i ? "scale-110 border-navy ring-2 ring-gold" : "border-white shadow"}`} style={{ background: c }} />)}</div></div>
  );
  const Chips = <T extends string>({ label, opts, value, names, onPick }: { label: string; opts: readonly T[]; value: T; names: Record<string, string>; onPick: (v: T) => void }) => (
    <div><p className="mb-1.5 text-sm font-bold text-navy">{label}</p>
      <div className="flex flex-wrap gap-2">{opts.map((o) => <button key={o} type="button" aria-pressed={value === o} onClick={() => onPick(o)} className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold transition ${value === o ? "border-gold bg-gold/20 text-navy" : "border-navy/10 bg-white text-navy/70 hover:border-gold/60"}`}>{names[o]}</button>)}</div></div>
  );

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#bfe9e3] via-[#d6e8ff] to-[#e4d2f5] py-14 text-navy">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none text-4xl opacity-30">
          <span className="absolute start-[8%] top-[18%]">⭐</span><span className="absolute end-[12%] top-[14%]">🚀</span><span className="absolute start-[40%] bottom-[10%]">✨</span><span className="absolute end-[30%] bottom-[18%]">🪐</span><span className="absolute start-[20%] bottom-[30%]">🎈</span>
        </div>
        <div className="container-x relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <span className="chip bg-white/80 text-navy">{k.hero.badge}</span>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{k.hero.h1}</h1>
            <p className="mt-3 max-w-xl text-lg text-navy/80">{k.hero.sub}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#builder" className="btn btn-gold">{k.hero.cta}</a>
              <Link href={`/${locale}/courses?audience=kids`} className="btn btn-outline !bg-white/70">{k.hero.courses}</Link>
            </div>
            <p className="mt-3 text-xs text-navy/70">{k.hero.parent}</p>
          </div>
          <div className="flex justify-center"><div className="rounded-[2rem] bg-white/60 p-6 shadow-xl backdrop-blur"><KidAvatar look={look} size={200} label={nick} /><p className="mt-3 text-center text-lg font-black">{nick}</p></div></div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x relative z-10 -mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {k.steps.map(([n, h, p]) => (
          <div key={n} className="card flex items-start gap-3 p-4"><span className="gold-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black text-navy">{n}</span><div><b className="text-navy">{h}</b><p className="text-sm text-mute">{p}</p></div></div>
        ))}
      </section>

      {/* BUILDER + PROFILE */}
      <section id="builder" className="container-x scroll-mt-24 py-12">
        <h2 className="mb-5 text-2xl font-black text-navy">{k.builder.title}</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="card space-y-5 p-6">
            <label className="block text-sm font-bold text-navy">{k.builder.nickname}
              <input className="input mt-1.5" maxLength={20} placeholder={k.builder.nicknamePh} value={s.nick} onChange={(e) => setS({ ...s, nick: e.target.value, saved: false })} />
              <span className="mt-1 block text-xs font-normal text-mute">{k.builder.nicknameHint}</span>
            </label>
            <Swatches label={k.builder.skin} colors={SKINS} value={look.skin} onPick={(i) => setLook({ skin: i })} />
            <Chips label={k.builder.hair} opts={["none", "short", "spiky", "curly", "bun"] as const} value={look.hair} names={k.builder.hairs} onPick={(v) => setLook({ hair: v })} />
            {look.hair !== "none" && <Swatches label={k.builder.hairColor} colors={HAIRS} value={look.hairColor} onPick={(i) => setLook({ hairColor: i })} />}
            <Swatches label={k.builder.outfit} colors={OUTFITS} value={look.outfit} onPick={(i) => setLook({ outfit: i })} />
            <Chips label={k.builder.accessory} opts={["none", "glasses", "crown", "star", "headphones"] as const} value={look.accessory} names={k.builder.accessories} onPick={(v) => setLook({ accessory: v })} />
            <Swatches label={k.builder.background} colors={BGS.map((b) => b[1])} value={look.bg} onPick={(i) => setLook({ bg: i })} />
            <label className="flex items-center gap-2 text-sm font-bold text-navy"><input type="checkbox" className="h-4 w-4 accent-[#c49c3e]" checked={look.cape} onChange={(e) => setLook({ cape: e.target.checked })} />{k.builder.cape}</label>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-gold" onClick={saveHero}>{k.builder.save}</button>
              <button className="btn btn-outline" onClick={() => setLook({ skin: Math.floor(Math.random() * SKINS.length), hair: pick(["none", "short", "spiky", "curly", "bun"] as const), hairColor: Math.floor(Math.random() * HAIRS.length), outfit: Math.floor(Math.random() * OUTFITS.length), accessory: pick(["none", "glasses", "crown", "star", "headphones"] as const), bg: Math.floor(Math.random() * BGS.length), cape: Math.random() > 0.4 })}>🎲 {k.builder.random}</button>
              {msg && <span role="status" className="font-bold text-emerald-700">✓ {msg}</span>}
            </div>
          </div>

          <aside className="card h-fit space-y-4 p-6 text-center">
            <div className="flex justify-center"><KidAvatar look={look} size={140} label={nick} /></div>
            <p className="text-xl font-black text-navy">{nick}</p>
            <p className="chip bg-gold/20 text-gold-deep">{k.stats.level} {num(level, locale)} · {k.levels[level - 1]}</p>
            <div>
              <div className="h-3 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={inLevel}><div className="gold-bg h-full rounded-full transition-all" style={{ width: `${inLevel}%` }} /></div>
              <p className="mt-1 text-xs text-mute">{num(s.xp, locale)} {k.stats.xp}{level < 5 ? ` · ${num(100 - inLevel, locale)} ${k.stats.toNext}` : ` · ${k.stats.maxLevel}`}</p>
            </div>
            <p className="text-sm font-bold text-navy">🔥 {num(s.streak, locale)} {k.stats.streak}</p>
            <div>
              <p className="mb-2 text-sm font-bold text-navy">{k.stats.badges}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {badges.length === 0 ? <span className="text-xs text-mute">-</span> : badges.map((b) => { const [n, d] = k.badgesList[b as keyof typeof k.badgesList]; return <span key={b} title={d} className="chip bg-sand text-navy">🏅 {n}</span>; })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* MISSIONS */}
      <section className="bg-cream-2 py-12">
        <div className="container-x">
          <h2 className="text-2xl font-black text-navy">{k.missions.title}</h2>
          <p className="mb-5 text-sm text-mute">{k.missions.hint}</p>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {k.missions.list.map(([id, label, xp]) => {
              const done = s.done.includes(id as string);
              return (
                <li key={id as string} className={`card flex items-center gap-3 p-4 ${done ? "bg-emerald-50" : ""}`}>
                  <span className="text-2xl">{done ? "✅" : "🎯"}</span>
                  <div className="min-w-0 flex-1"><p className="font-bold text-navy">{label}</p><p className="text-xs text-gold-deep">+{num(xp as number, locale)} {k.stats.xp}</p></div>
                  {done ? <span className="text-sm font-bold text-emerald-700">{k.missions.done}</span> : <button className="btn btn-outline !py-1.5 text-sm" onClick={() => earn(id as string, xp as number)}>{k.missions.go}</button>}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="container-x py-12">
        <h2 className="text-2xl font-black text-navy">{k.projects.title}</h2>
        <p className="mb-5 text-sm text-mute">{k.projects.sub}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {k.projects.samples.map(([name, kind, idea], i) => {
            const id = `s${i}`, cheered = s.cheered.includes(id), h = SAMPLE_HEROES[i % SAMPLE_HEROES.length];
            return (
              <article key={id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3"><KidAvatar look={h.look} size={44} /><div><p className="text-sm font-bold text-navy">{h.nick[locale === "ar" ? 0 : 1]}</p><p className="text-xs text-mute">{k.projects.kinds[kind as keyof typeof k.projects.kinds]}</p></div></div>
                <p className="text-3xl">{KIND_EMOJI[kind as string]}</p>
                <div className="flex-1"><h3 className="font-black text-navy">{name}</h3><p className="text-sm text-mute">{idea}</p></div>
                <div className="flex items-center gap-2">
                  <button disabled={cheered} onClick={() => cheer(id)} className={`btn !py-1.5 text-sm ${cheered ? "bg-emerald-100 text-emerald-800" : "btn-outline"}`}>{cheered ? `${EMOJI[i % 4]} ${k.projects.cheered}` : `${EMOJI[i % 4]} ${k.projects.cheer}`}</button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="card space-y-4 p-6">
            <h3 className="font-black text-navy">{k.projects.build}</h3>
            <label className="block text-sm font-bold text-navy">{k.projects.name}<input className="input mt-1.5" maxLength={40} placeholder={k.projects.namePh} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <Chips label={k.projects.kind} opts={Object.keys(k.projects.kinds) as (keyof typeof k.projects.kinds)[]} value={draft.kind as keyof typeof k.projects.kinds} names={k.projects.kinds} onPick={(v) => setDraft({ ...draft, kind: v })} />
            <label className="block text-sm font-bold text-navy">{k.projects.idea}<input className="input mt-1.5" maxLength={120} placeholder={k.projects.ideaPh} value={draft.idea} onChange={(e) => setDraft({ ...draft, idea: e.target.value })} /></label>
            <button className="btn btn-gold" onClick={addProject} disabled={!draft.name.trim()}>+ {k.projects.add}</button>
            <p className="text-xs text-mute">{k.projects.review}</p>
          </div>
          <div className="card p-6">
            <h3 className="mb-3 font-black text-navy">{k.projects.mine}</h3>
            {s.projects.length === 0 ? <p className="text-mute">{k.projects.empty}</p> : (
              <ul className="space-y-3">
                {s.projects.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl bg-sand/60 p-3">
                    <span className="text-3xl">{KIND_EMOJI[p.kind]}</span>
                    <div className="min-w-0 flex-1"><p className="truncate font-bold text-navy">{p.name}</p><p className="truncate text-xs text-mute">{k.projects.kinds[p.kind as keyof typeof k.projects.kinds]}{p.idea ? ` · ${p.idea}` : ""}</p></div>
                    <button className="text-sm font-bold text-red-600 hover:underline" onClick={() => setS((x) => ({ ...x, projects: x.projects.filter((q) => q.id !== p.id) }))}>{k.projects.delete}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* HERO BOARD */}
      <section className="bg-navy py-12 text-white">
        <div className="container-x">
          <h2 className="text-2xl font-black text-gold-light">🏆 {k.board.title}</h2>
          <p className="mb-5 text-sm text-white/70">{k.board.sub}</p>
          <ol className="mx-auto max-w-2xl space-y-2">
            {board.map((h, i) => (
              <li key={h.me ? "me" : h.name} className={`flex items-center gap-3 rounded-2xl p-3 ${h.me ? "gold-bg text-navy" : "bg-white/10"}`}>
                <span className="w-8 text-center text-lg font-black">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : num(i + 1, locale)}</span>
                <KidAvatar look={h.look} size={44} />
                <span className="flex-1 truncate font-bold">{h.name}{h.me && <span className="ms-2 chip bg-navy text-gold-light">{k.board.you}</span>}</span>
                <b>{num(h.xp, locale)} <span className="text-xs font-normal opacity-80">{k.board.xp}</span></b>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-center text-xs text-white/60">{k.board.note}</p>
        </div>
      </section>

      {/* COURSES */}
      <section className="container-x py-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black text-navy">{k.courses.title}</h2><p className="text-sm text-mute">{k.courses.sub}</p></div><Link href={`/${locale}/courses?audience=kids`} className="btn btn-outline">{k.courses.all}</Link></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{courses.slice(0, 3).map((c) => <CourseCard key={c.id} course={c} mentor={mById.get(c.mentorId)} locale={locale} t={t} />)}</div>
      </section>

      {/* SAFETY */}
      <section className="band py-10">
        <div className="container-x">
          <h2 className="mb-3 text-lg font-black text-navy">🛡️ {k.safety.title}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">{k.safety.items.map((x) => <li key={x} className="flex gap-2 text-sm"><span className="text-emerald-600">✓</span>{x}</li>)}</ul>
          <p className="mt-3 text-xs text-mute">{k.safety.demo}</p>
        </div>
      </section>
    </>
  );
}
