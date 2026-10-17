import GameCanvas from "../screens/GameCanvas";
import PolicyHeatmap from "../screens/PolicyHeatmap";
import RewardChart from "../screens/RewardChart";
import { DROPS } from "../brain/lane";
import Controls from "./Controls";
import { useTrainer } from "./useTrainer";

const OUTCOME_LABELS = {
  caught: "caught · +1",
  missed: "missed · −1",
  scorched: "burnt · −1",
  dodged: "dodged · 0",
};

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="readout">
      <div className="readout-label">{label}</div>
      <div className="readout-value">{value}</div>
    </div>
  );
}

export default function ReelRunner() {
  const trainer = useTrainer();
  const { brain, greedy } = trainer;
  const { lane, total } = brain.run;

  return (
    <section className="runner">
      <div className="stage">
        <div className="column">
          <GameCanvas lane={lane} />
          <div className="readouts">
            <Readout label="episode" value={String(brain.episodes + 1)} />
            <Readout
              label="reel score"
              value={`${total > 0 ? "+" : ""}${total}`}
            />
            <Readout
              label="frame"
              value={`${Math.min(lane.drops + 1, DROPS)}/${DROPS}`}
            />
          </div>
          <p className="status">
            {greedy
              ? "greedy · epsilon 0, not learning"
              : `training · epsilon ${brain.epsilon.toFixed(2)}`}
            {brain.outcome && ` · last ${OUTCOME_LABELS[brain.outcome]}`}
          </p>
        </div>
        <div className="column wide">
          <RewardChart history={brain.history} />
          <PolicyHeatmap q={brain.q} catcher={lane.catcher} />
        </div>
      </div>
      <Controls trainer={trainer} />
    </section>
  );
}
