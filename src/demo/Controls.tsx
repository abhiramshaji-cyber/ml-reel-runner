import type { Rule } from "../brain/agent";
import type { Speed, useTrainer } from "./useTrainer";

type Trainer = ReturnType<typeof useTrainer>;

function Knob({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="knob">
      <span className="label">
        {label}
        <span className="knob-value">{value.toFixed(step < 0.01 ? 3 : 2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="choice">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function Controls({ trainer }: { trainer: Trainer }) {
  const {
    knobs,
    setKnobs,
    brain,
    setEpsilon,
    running,
    setRunning,
    speed,
    setSpeed,
    greedy,
    setGreedy,
    reset,
  } = trainer;

  return (
    <div className="controls">
      <div className="row">
        <button
          type="button"
          className="btn"
          onClick={() => setRunning(!running)}
        >
          {running ? "Pause" : "Roll film"}
        </button>
        <button
          type="button"
          className="btn secondary"
          aria-pressed={greedy}
          onClick={() => setGreedy(!greedy)}
        >
          {greedy ? "Back to training" : "Watch greedy policy"}
        </button>
        <button type="button" className="btn ghost" onClick={reset}>
          Reset brain
        </button>
      </div>

      <div className="row loose">
        <Choice<Speed>
          label="Speed"
          options={["1x", "fast"]}
          value={speed}
          onChange={setSpeed}
        />
        <Choice<Rule>
          label="Update rule"
          options={["q-learning", "sarsa"]}
          value={knobs.rule}
          onChange={(rule) => setKnobs({ rule })}
        />
      </div>

      <div className="knobs">
        <Knob
          label="alpha · learning rate"
          value={knobs.alpha}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(alpha) => setKnobs({ alpha })}
        />
        <Knob
          label="gamma · discount"
          value={knobs.gamma}
          min={0}
          max={0.99}
          step={0.01}
          onChange={(gamma) => setKnobs({ gamma })}
        />
        <Knob
          label="epsilon · explore"
          value={brain.epsilon}
          min={0}
          max={1}
          step={0.01}
          onChange={setEpsilon}
        />
        <Knob
          label="epsilon decay / episode"
          value={knobs.decay}
          min={0.9}
          max={0.999}
          step={0.001}
          onChange={(decay) => setKnobs({ decay })}
        />
      </div>
    </div>
  );
}
