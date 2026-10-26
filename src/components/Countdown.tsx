"use client";

import { useEffect, useState } from "react";

type Left = { d: string; h: string; m: string; s: string; active: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

function calc(end: number): Left {
  const secs = Math.max(0, Math.floor((end - Date.now()) / 1000));
  return {
    d: pad(Math.floor(secs / 86400)),
    h: pad(Math.floor((secs % 86400) / 3600)),
    m: pad(Math.floor((secs % 3600) / 60)),
    s: pad(secs % 60),
    active: secs > 0,
  };
}

/** Ticks every second. Returns null until mounted so server and client HTML match. */
export function useCountdown(offerEnd?: string): Left | null {
  const [left, setLeft] = useState<Left | null>(null);
  useEffect(() => {
    if (!offerEnd) return;
    const end = new Date(offerEnd).getTime();
    if (Number.isNaN(end)) return;
    setLeft(calc(end));
    const t = setInterval(() => setLeft(calc(end)), 1000);
    return () => clearInterval(t);
  }, [offerEnd]);
  return left;
}

/** Pinned bar at the top of the page. */
export function CountdownBar({ offerEnd, note }: { offerEnd?: string; note: string }) {
  const left = useCountdown(offerEnd);
  const show = !offerEnd || !left || left.active;

  return (
    <div className="sticky top-0 z-30 bg-ink px-4 py-2 text-sm text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        {offerEnd && show ? (
          <div className="flex items-center gap-2 font-bold" role="timer" aria-live="off">
            <span className="text-highlight">Ակցիան ավարտվում է՝</span>
            <span className="text-base tabular-nums tracking-wide">
              {left ? `${left.d} օր ${left.h}:${left.m}:${left.s}` : "-- օր --:--:--"}
            </span>
          </div>
        ) : null}
        {/* on phones the bottom bar already says this, so keep the top bar to one line */}
        <span className="hidden font-medium text-[#c9ced2] sm:inline">{note}</span>
      </div>
    </div>
  );
}

/** Large boxes inside the price card. */
export function CountdownBoxes({ offerEnd }: { offerEnd?: string }) {
  const left = useCountdown(offerEnd);
  if (!offerEnd) return null;
  if (left && !left.active) {
    return <div className="font-bold text-ink-2">Ակցիան ավարտվել է</div>;
  }
  const cells: [string, string][] = [
    [left?.d ?? "--", "օր"],
    [left?.h ?? "--", "ժամ"],
    [left?.m ?? "--", "րոպե"],
    [left?.s ?? "--", "վրկ"],
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[15px] font-bold text-sale">Ակցիան ավարտվում է՝</div>
      <div className="flex gap-2" role="timer" aria-live="off">
        {cells.map(([v, label]) => (
          <div key={label} className="flex-1 rounded-lg bg-ink px-1 py-2 text-center text-white">
            <div className="text-[26px] font-extrabold leading-tight tabular-nums">{v}</div>
            <div className="text-xs text-[#c9ced2]">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
