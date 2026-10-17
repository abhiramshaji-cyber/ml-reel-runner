import type { Rng } from "./rng";

export const COLUMNS = 5;
export const ROWS = 5;
export const DROPS = 20;
export const BURNT_CHANCE = 0.3;
export const ACTIONS = [-1, 0, 1] as const;
export const ACTION_NAMES = ["left", "stay", "right"] as const;
export const FALL_ROWS = ROWS - 1;
export const STATE_COUNT = COLUMNS * COLUMNS * FALL_ROWS * 2;

export type Lane = {
  catcher: number;
  frameX: number;
  frameY: number;
  burnt: boolean;
  drops: number;
  done: boolean;
};

export type Outcome = "caught" | "missed" | "scorched" | "dodged" | null;

export type Step = { lane: Lane; reward: number; outcome: Outcome };

export const REWARDS: Record<Exclude<Outcome, null>, number> = {
  caught: 1,
  missed: -1,
  scorched: -1,
  dodged: 0,
};

function spawn(
  lane: Omit<Lane, "frameX" | "frameY" | "burnt">,
  rng: Rng,
): Lane {
  return {
    ...lane,
    frameX: Math.floor(rng() * COLUMNS),
    frameY: 0,
    burnt: rng() < BURNT_CHANCE,
  };
}

export function openLane(rng: Rng): Lane {
  return spawn(
    { catcher: Math.floor(COLUMNS / 2), drops: 0, done: false },
    rng,
  );
}

export function stateOf(lane: Lane): number {
  return (
    ((lane.catcher * COLUMNS + lane.frameX) * FALL_ROWS + lane.frameY) * 2 +
    (lane.burnt ? 1 : 0)
  );
}

export function advance(lane: Lane, action: number, rng: Rng): Step {
  if (lane.done) return { lane, reward: 0, outcome: null };

  const catcher = Math.min(
    COLUMNS - 1,
    Math.max(0, lane.catcher + ACTIONS[action]),
  );
  const frameY = lane.frameY + 1;
  if (frameY < FALL_ROWS)
    return { lane: { ...lane, catcher, frameY }, reward: 0, outcome: null };

  // land
  const under = catcher === lane.frameX;
  const outcome: Outcome = lane.burnt
    ? under
      ? "scorched"
      : "dodged"
    : under
      ? "caught"
      : "missed";
  const drops = lane.drops + 1;
  const done = drops >= DROPS;
  const next = done
    ? { ...lane, catcher, frameY: FALL_ROWS, drops, done }
    : spawn({ catcher, drops, done }, rng);
  return { lane: next, reward: REWARDS[outcome], outcome };
}
