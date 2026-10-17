import { useEffect, useRef } from "react";
import { usePaletteColors } from "../usePaletteColors";
import { BURNT_CHANCE, DROPS } from "../brain/lane";

const WIDTH = 600;
const HEIGHT = 220;
const PAD = 14;
const WINDOW = 50;
const TOKENS = [
  "--card",
  "--border",
  "--muted-foreground",
  "--accent-1",
  "--accent-3",
];
const BEST = DROPS * (1 - BURNT_CHANCE);

function movingAverage(values: number[]): number[] {
  let sum = 0;
  return values.map((v, i) => {
    sum += v - (i >= WINDOW ? values[i - WINDOW] : 0);
    return sum / Math.min(i + 1, WINDOW);
  });
}

function bucket(values: number[], slots: number): number[] {
  if (values.length <= slots) return values;
  const size = values.length / slots;
  return Array.from({ length: slots }, (_, i) => {
    const part = values.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    return part.reduce((a, b) => a + b, 0) / part.length;
  });
}

export default function RewardChart({ history }: { history: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [card, border, muted, average, best] = usePaletteColors(TOKENS);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== WIDTH * dpr) {
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = card;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const y = (v: number) =>
      PAD + ((DROPS - v) / (DROPS * 2)) * (HEIGHT - PAD * 2);

    // guides
    ctx.lineWidth = 1;
    ctx.strokeStyle = border;
    ctx.beginPath();
    ctx.moveTo(0, y(0));
    ctx.lineTo(WIDTH, y(0));
    ctx.stroke();
    ctx.strokeStyle = best;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(0, y(BEST));
    ctx.lineTo(WIDTH, y(BEST));
    ctx.stroke();
    ctx.setLineDash([]);

    if (history.length < 2) return;
    const slots = WIDTH - PAD * 2;
    const line = (
      values: number[],
      color: string,
      width: number,
      alpha: number,
    ) => {
      const pts = bucket(values, slots);
      const x = (i: number) => PAD + (i / Math.max(pts.length - 1, 1)) * slots;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      pts.forEach((v, i) =>
        i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)),
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    line(history, muted, 1, 0.45);
    line(movingAverage(history), average, 2.5, 1);
  });

  const recent = history.slice(-WINDOW);
  const mean = recent.length
    ? recent.reduce((a, b) => a + b, 0) / recent.length
    : 0;

  return (
    <figure className="chart">
      <canvas
        ref={ref}
        role="img"
        aria-label={`Reward per episode over ${history.length} episodes, recent average ${mean.toFixed(1)} out of about ${BEST}`}
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      />
      <figcaption className="legend label">
        <span className="legend-item average">
          <span className="swatch" />
          {WINDOW} episode average
        </span>
        <span>faint · reward per episode</span>
        <span className="legend-item best">
          <span className="swatch dashed" />
          best possible ≈ {BEST}
        </span>
      </figcaption>
    </figure>
  );
}
