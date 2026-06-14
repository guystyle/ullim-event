"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/lib/config";

const SYMBOLS = ["🌊", "🎧", "⭐", "🍀", "✨", "🎁"];
const JACKPOT = "🎁";
const CELL = 104; // px — globals.css의 .reel-cell 높이와 일치해야 함
const DURATIONS = [1900, 2550, 3200]; // 릴별 정지 시간(ms), 순차 정지
const SETTLE_MS = 600; // 마지막 릴 정지 후 결과 공개까지 여유

function randInt(n: number) {
  return Math.floor(Math.random() * n);
}

function buildStrip(finalSymbol: string, length: number): string[] {
  const strip: string[] = [];
  for (let i = 0; i < length - 1; i++) {
    let s = SYMBOLS[randInt(SYMBOLS.length)];
    // 연속 중복은 피해서 회전이 풍성해 보이도록
    while (i > 0 && s === strip[i - 1]) s = SYMBOLS[randInt(SYMBOLS.length)];
    strip.push(s);
  }
  strip.push(finalSymbol);
  return strip;
}

function finalCombo(outcome: "win" | "lose"): [string, string, string] {
  if (outcome === "win") return [JACKPOT, JACKPOT, JACKPOT];

  const others = SYMBOLS.filter((s) => s !== JACKPOT);
  // 40%는 "두 칸 일치" 아깝게 빗나가는 연출
  if (Math.random() < 0.4) {
    return [JACKPOT, JACKPOT, others[randInt(others.length)]];
  }
  const a = SYMBOLS[randInt(SYMBOLS.length)];
  const b = SYMBOLS[randInt(SYMBOLS.length)];
  let c = SYMBOLS[randInt(SYMBOLS.length)];
  while (a === b && b === c) c = SYMBOLS[randInt(SYMBOLS.length)];
  return [a, b, c];
}

interface SlotMachineProps {
  outcome: "win" | "lose";
  onDone: () => void;
}

export default function SlotMachine({ outcome, onDone }: SlotMachineProps) {
  const combo = useMemo(() => finalCombo(outcome), [outcome]);
  const strips = useMemo(
    () => combo.map((s, i) => buildStrip(s, 22 + i * 6)),
    [combo],
  );

  const [launched, setLaunched] = useState(false);
  const [stopped, setStopped] = useState<boolean[]>([false, false, false]);
  const [finished, setFinished] = useState(false);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // 초기 transform이 커밋된 다음 프레임에 회전 시작 (transition 보장)
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setLaunched(true));
    });

    const stopTimers = DURATIONS.map((d, i) =>
      setTimeout(() => {
        setStopped((prev) => prev.map((v, j) => (j === i ? true : v)));
      }, d),
    );
    const doneTimer = setTimeout(() => {
      setFinished(true);
      onDoneRef.current();
    }, Math.max(...DURATIONS) + SETTLE_MS);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      stopTimers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, []);

  const machineClass = [
    "machine",
    finished && outcome === "win" ? "win" : "",
    finished && outcome === "lose" ? "shake" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={machineClass}>
      <p className="machine-marquee">{site.brandNameEn} LUCKY DRAW</p>
      <div className="reels">
        {strips.map((strip, i) => (
          <div
            key={i}
            className={`reel-window${stopped[i] ? " stopped" : ""}`}
          >
            <div
              className={`reel-strip${launched && !stopped[i] ? " spinning" : ""}`}
              style={{
                transform: launched
                  ? `translateY(${-(strip.length - 1) * CELL}px)`
                  : "translateY(0)",
                transition: launched
                  ? `transform ${DURATIONS[i]}ms cubic-bezier(.21,.86,.3,1.08)`
                  : "none",
              }}
            >
              {strip.map((symbol, j) => (
                <div className="reel-cell" key={j}>
                  {symbol}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="lights" aria-hidden>
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className="light"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
