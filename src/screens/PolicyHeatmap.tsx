import { bestValue } from "../brain/agent";
import {
  ACTION_NAMES,
  ACTIONS,
  COLUMNS,
  FALL_ROWS,
  stateOf,
} from "../brain/lane";

const GLYPHS = ["←", "•", "→"];

type Cell = { value: number; action: number | null };

function readCell(
  q: Float64Array,
  catcher: number,
  frameX: number,
  frameY: number,
  burnt: boolean,
): Cell {
  const state = stateOf({
    catcher,
    frameX,
    frameY,
    burnt,
    drops: 0,
    done: false,
  });
  const row = Array.from(
    q.subarray(state * ACTIONS.length, (state + 1) * ACTIONS.length),
  );
  const value = bestValue(q, state);
  return {
    value,
    action: row.every((v) => v === row[0]) ? null : row.indexOf(value),
  };
}

function Grid({
  label,
  cells,
  scale,
  catcher,
}: {
  label: string;
  cells: Cell[][];
  scale: number;
  catcher: number;
}) {
  return (
    <figure className="grid-figure">
      <figcaption className="label">{label}</figcaption>
      <div
        className="cells"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
      >
        {cells.flatMap((row, y) =>
          row.map((cell, x) => {
            const share = Math.round(
              Math.min(1, Math.abs(cell.value) / scale) * 80,
            );
            const tone =
              cell.value >= 0 ? "var(--accent-1)" : "var(--destructive)";
            return (
              <div
                key={`${x}-${y}`}
                title={`frame at column ${x + 1}, row ${y + 1}: best ${cell.action === null ? "unknown" : ACTION_NAMES[cell.action]}, value ${cell.value.toFixed(2)}`}
                className="cell"
                style={{
                  background: `color-mix(in oklab, ${tone} ${share}%, var(--card))`,
                }}
              >
                {cell.action === null ? "" : GLYPHS[cell.action]}
              </div>
            );
          }),
        )}
        {Array.from({ length: COLUMNS }, (_, x) => (
          <div
            key={`p${x}`}
            className={`projector-mark${x === catcher ? " here" : ""}`}
          />
        ))}
      </div>
    </figure>
  );
}

export default function PolicyHeatmap({
  q,
  catcher,
}: {
  q: Float64Array;
  catcher: number;
}) {
  const read = (burnt: boolean) =>
    Array.from({ length: FALL_ROWS }, (_, y) =>
      Array.from({ length: COLUMNS }, (_, x) =>
        readCell(q, catcher, x, y, burnt),
      ),
    );
  const film = read(false);
  const burnt = read(true);
  const scale = Math.max(
    0.25,
    ...[...film, ...burnt].flat().map((c) => Math.abs(c.value)),
  );

  return (
    <div className="heatmap">
      <div className="heatmap-pair">
        <Grid label="film frame" cells={film} scale={scale} catcher={catcher} />
        <Grid
          label="burnt frame"
          cells={burnt}
          scale={scale}
          catcher={catcher}
        />
      </div>
      <p className="hint">
        Each cell is where a frame could be, seen from the projector&apos;s
        column. Arrow · best move. Color · how good it looks.
      </p>
    </div>
  );
}
