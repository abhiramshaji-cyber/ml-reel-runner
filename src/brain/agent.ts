import { ACTIONS, STATE_COUNT } from "./lane";
import type { Rng } from "./rng";

export type Rule = "q-learning" | "sarsa";

export type Knobs = {
  alpha: number;
  gamma: number;
  decay: number;
  floor: number;
  rule: Rule;
};

export const DEFAULT_KNOBS: Knobs = {
  alpha: 0.2,
  gamma: 0.9,
  decay: 0.99,
  floor: 0.02,
  rule: "q-learning",
};

export const blankQ = () => new Float64Array(STATE_COUNT * ACTIONS.length);

export function bestValue(q: Float64Array, state: number): number {
  const at = state * ACTIONS.length;
  return Math.max(...q.subarray(at, at + ACTIONS.length));
}

export function greedy(q: Float64Array, state: number, rng: Rng): number {
  const top = bestValue(q, state);
  const ties = ACTIONS.map((_, a) => a).filter(
    (a) => q[state * ACTIONS.length + a] === top,
  );
  return ties[Math.floor(rng() * ties.length)];
}

export function choose(
  q: Float64Array,
  state: number,
  epsilon: number,
  rng: Rng,
): number {
  return rng() < epsilon
    ? Math.floor(rng() * ACTIONS.length)
    : greedy(q, state, rng);
}

export function learn(
  q: Float64Array,
  knobs: Knobs,
  move: {
    state: number;
    action: number;
    reward: number;
    next: number;
    nextAction: number;
    done: boolean;
  },
) {
  const lookahead =
    knobs.rule === "sarsa"
      ? q[move.next * ACTIONS.length + move.nextAction]
      : bestValue(q, move.next);
  const target = move.reward + (move.done ? 0 : knobs.gamma * lookahead);
  const at = move.state * ACTIONS.length + move.action;
  q[at] += knobs.alpha * (target - q[at]);
}
