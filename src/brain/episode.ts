import { choose, learn, type Knobs } from "./agent";
import { advance, openLane, stateOf, type Lane, type Outcome } from "./lane";
import type { Rng } from "./rng";

export type Run = { lane: Lane; action: number; total: number };

export type Mode = { knobs: Knobs; epsilon: number; learning: boolean };

export function startRun(q: Float64Array, epsilon: number, rng: Rng): Run {
  const lane = openLane(rng);
  return { lane, action: choose(q, stateOf(lane), epsilon, rng), total: 0 };
}

export function tick(
  q: Float64Array,
  run: Run,
  mode: Mode,
  rng: Rng,
): { run: Run; outcome: Outcome } {
  const state = stateOf(run.lane);
  const { lane, reward, outcome } = advance(run.lane, run.action, rng);
  const next = lane.done ? state : stateOf(lane);
  const nextAction = choose(q, next, mode.epsilon, rng);
  if (mode.learning)
    learn(q, mode.knobs, {
      state,
      action: run.action,
      reward,
      next,
      nextAction,
      done: lane.done,
    });
  return {
    run: { lane, action: nextAction, total: run.total + reward },
    outcome,
  };
}

export function playEpisode(q: Float64Array, mode: Mode, rng: Rng): number {
  let run = startRun(q, mode.epsilon, rng);
  while (!run.lane.done) run = tick(q, run, mode, rng).run;
  return run.total;
}

export const decayed = (epsilon: number, knobs: Knobs) =>
  Math.max(knobs.floor, epsilon * knobs.decay);
