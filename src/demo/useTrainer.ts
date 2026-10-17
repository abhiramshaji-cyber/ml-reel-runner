import { useCallback, useEffect, useRef, useState } from "react";
import { blankQ, DEFAULT_KNOBS, type Knobs } from "../brain/agent";
import { decayed, startRun, tick, type Run } from "../brain/episode";
import type { Outcome } from "../brain/lane";
import { seeded, type Rng } from "../brain/rng";

export type Speed = "1x" | "fast";

const TICKS_PER_SECOND = 14;
const FAST_BUDGET_MS = 9;
const HISTORY_CAP = 20000;

type Brain = {
  q: Float64Array;
  rng: Rng;
  run: Run;
  epsilon: number;
  history: number[];
  episodes: number;
  outcome: Outcome;
};

function freshBrain(seed: number): Brain {
  const rng = seeded(seed);
  const q = blankQ();
  return {
    q,
    rng,
    run: startRun(q, 1, rng),
    epsilon: 1,
    history: [],
    episodes: 0,
    outcome: null,
  };
}

const prefersStill = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useTrainer() {
  const brain = useRef<Brain | null>(null);
  brain.current ??= freshBrain(1);
  const [knobs, setKnobsState] = useState<Knobs>(DEFAULT_KNOBS);
  const [running, setRunning] = useState(() => !prefersStill());
  const [speed, setSpeed] = useState<Speed>("1x");
  const [greedy, setGreedy] = useState(false);
  const [, setFrame] = useState(0);
  const knobsRef = useRef(knobs);

  useEffect(() => {
    knobsRef.current = knobs;
  }, [knobs]);

  // loop
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let owed = 0;
    const fast = speed === "fast" && !greedy;
    const frame = (now: number) => {
      const b = brain.current!;
      const step = () => {
        const mode = {
          knobs: knobsRef.current,
          epsilon: greedy ? 0 : b.epsilon,
          learning: !greedy,
        };
        const next = tick(b.q, b.run, mode, b.rng);
        b.run = next.run;
        if (next.outcome) b.outcome = next.outcome;
        if (!b.run.lane.done) return;
        if (!greedy) {
          b.history.push(b.run.total);
          if (b.history.length > HISTORY_CAP) b.history.shift();
          b.episodes += 1;
          b.epsilon = decayed(b.epsilon, knobsRef.current);
        }
        b.run = startRun(b.q, greedy ? 0 : b.epsilon, b.rng);
      };
      if (fast) {
        const start = performance.now();
        while (performance.now() - start < FAST_BUDGET_MS) step();
      } else {
        owed = Math.min(owed + ((now - last) / 1000) * TICKS_PER_SECOND, 3);
        for (; owed >= 1; owed -= 1) step();
      }
      last = now;
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, greedy]);

  const setKnobs = useCallback(
    (patch: Partial<Knobs>) => setKnobsState((k) => ({ ...k, ...patch })),
    [],
  );

  const setEpsilon = useCallback((epsilon: number) => {
    brain.current!.epsilon = epsilon;
    setFrame((f) => f + 1);
  }, []);

  const reset = useCallback(() => {
    brain.current = freshBrain(Date.now());
    setFrame((f) => f + 1);
  }, []);

  return {
    brain: brain.current,
    knobs,
    setKnobs,
    setEpsilon,
    running,
    setRunning,
    speed,
    setSpeed,
    greedy,
    setGreedy,
    reset,
  };
}
