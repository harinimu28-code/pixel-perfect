import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack } from "lucide-react";
import { useStage, TRACKS, TIMELINE_LENGTH, MARKERS, type Department } from "@/lib/stage-store";

const TRACK_CLS: Record<Department, string> = {
  Stage: "bg-track-stage",
  Lighting: "bg-track-lighting",
  Sound: "bg-track-sound",
  "LED Screen": "bg-track-led",
  Props: "bg-track-props",
  Design: "bg-track-props",
};

const fmt = (m: number) => {
  const total = 18 * 60 + m; // show starts 18:00
  const h = Math.floor(total / 60);
  const mm = Math.floor(total % 60);
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export function Timeline({ tall = false }: { tall?: boolean }) {
  const playhead = useStage((s) => s.playhead);
  const setPlayhead = useStage((s) => s.setPlayhead);
  const [playing, setPlaying] = useState(false);
  const laneRef = useRef<HTMLDivElement>(null);
  const [selectedEvt, setSelectedEvt] = useState<string | null>(null);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const t = useStage.getState().playhead + dt * 4; // 4 show-minutes / sec
      if (t >= TIMELINE_LENGTH) {
        setPlayhead(TIMELINE_LENGTH);
        setPlaying(false);
        return;
      }
      setPlayhead(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, setPlayhead]);

  const scrub = (clientX: number) => {
    const r = laneRef.current?.getBoundingClientRect();
    if (!r) return;
    setPlayhead(((clientX - r.left) / r.width) * TIMELINE_LENGTH);
  };
  const startDrag = (e: React.PointerEvent) => {
    scrub(e.clientX);
    const move = (ev: PointerEvent) => scrub(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const events = useStage((s) => s.timelineEvents);
  const pct = (t: number) => `${(t / TIMELINE_LENGTH) * 100}%`;
  const active = events.filter((e) => playhead >= e.start && playhead < e.end);
  const sel = events.find((e) => e.id === selectedEvt);
  const rowH = tall ? "h-10" : "h-6";

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-border px-2">
        <span className="panel-label mr-2">Production Timeline</span>
        <button className="tool-btn" onClick={() => setPlayhead(0)} title="Rewind">
          <SkipBack className="h-3 w-3" />
        </button>
        <button className="tool-btn" data-active={playing} onClick={() => setPlaying((p) => !p)} title="Play / Pause">
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <span className="ml-1 font-mono text-xs text-foreground">{fmt(playhead)}</span>
        <span className="font-mono text-[10px] text-muted-foreground">/ {fmt(TIMELINE_LENGTH)}</span>
        <div className="ml-4 flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <span className="panel-label shrink-0">Live cues</span>
          {active.map((e) => (
            <span key={e.id} className="shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px]">
              <span className="text-muted-foreground">{e.track}:</span> {e.label}
            </span>
          ))}
        </div>
        {sel && (
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {sel.label} · {fmt(sel.start)}–{fmt(sel.end)}
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 overflow-auto">
        <div className="w-28 shrink-0 border-r border-border">
          <div className="h-5 border-b border-border" />
          {TRACKS.map((t) => (
            <div key={t} className={`${rowH} flex items-center gap-2 border-b border-border/60 px-2 text-[11px] text-muted-foreground`}>
              <span className={`h-2 w-2 rounded-[1px] ${TRACK_CLS[t]}`} />
              {t}
            </div>
          ))}
        </div>
        <div ref={laneRef} className="relative min-w-[600px] flex-1 select-none">
          {/* ruler */}
          <div className="relative h-5 cursor-ew-resize border-b border-border bg-background/40" onPointerDown={startDrag}>
            {Array.from({ length: TIMELINE_LENGTH / 5 + 1 }, (_, i) => i * 5).map((t) => (
              <div key={t} className="absolute top-0 h-full" style={{ left: pct(t) }}>
                <div className={`w-px bg-border ${t % 15 === 0 ? "h-full" : "h-1.5"}`} />
                {t % 15 === 0 && (
                  <span className="absolute left-1 top-0.5 font-mono text-[9px] text-muted-foreground">{fmt(t)}</span>
                )}
              </div>
            ))}
            {MARKERS.map((m) => (
              <div key={m.t} className="absolute bottom-0 -translate-x-1/2" style={{ left: pct(m.t) }} title={m.label}>
                <div className="h-2 w-2 rotate-45 bg-warning" />
              </div>
            ))}
          </div>
          {TRACKS.map((t) => (
            <div key={t} className={`${rowH} relative border-b border-border/60`}>
              {events.filter((e) => e.track === t).map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEvt(e.id);
                    setPlayhead(e.start);
                  }}
                  className={`absolute top-1 bottom-1 overflow-hidden rounded-[2px] px-1.5 text-left text-[10px] text-foreground ring-primary transition-opacity hover:opacity-100 ${TRACK_CLS[t]} ${
                    selectedEvt === e.id ? "opacity-100 ring-1" : "opacity-75"
                  }`}
                  style={{ left: pct(e.start), width: pct(e.end - e.start) }}
                  title={`${e.label} ${fmt(e.start)}–${fmt(e.end)}`}
                >
                  <span className="truncate">{e.label}</span>
                </button>
              ))}
            </div>
          ))}
          {MARKERS.map((m) => (
            <div key={m.t} className="pointer-events-none absolute top-5 bottom-0 w-px bg-warning/30" style={{ left: pct(m.t) }} />
          ))}
          {/* playhead */}
          <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-primary" style={{ left: pct(playhead) }}>
            <div className="absolute -left-[5px] top-0 h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
