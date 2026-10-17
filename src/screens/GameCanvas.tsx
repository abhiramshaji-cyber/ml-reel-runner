import { useEffect, useRef } from "react";
import { usePaletteColors } from "../usePaletteColors";
import { COLUMNS, ROWS, type Lane } from "../brain/lane";

const SIZE = 320;
const TOKENS = [
  "--card",
  "--border",
  "--muted-foreground",
  "--accent-1",
  "--accent-2",
  "--destructive",
  "--background",
  "--foreground",
];

function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  fill: string,
  hole: string,
  burnt: boolean,
) {
  const pad = cell * 0.14;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2, cell * 0.08);
  ctx.fill();

  // sprockets
  ctx.fillStyle = hole;
  for (let i = 0; i < 3; i++) {
    const hy = y + pad + cell * 0.12 + i * cell * 0.2;
    ctx.fillRect(x + pad + cell * 0.05, hy, cell * 0.07, cell * 0.09);
    ctx.fillRect(x + cell - pad - cell * 0.12, hy, cell * 0.07, cell * 0.09);
  }

  if (!burnt) return;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
    const r = cell * (0.13 + 0.06 * Math.sin(a * 3));
    ctx.lineTo(x + cell / 2 + Math.cos(a) * r, y + cell / 2 + Math.sin(a) * r);
  }
  ctx.fill();
}

function drawProjector(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  body: string,
  lens: string,
) {
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(
    x + cell * 0.12,
    y + cell * 0.42,
    cell * 0.76,
    cell * 0.42,
    cell * 0.08,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + cell * 0.32, y + cell * 0.3, cell * 0.14, 0, Math.PI * 2);
  ctx.arc(x + cell * 0.66, y + cell * 0.3, cell * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lens;
  ctx.beginPath();
  ctx.arc(x + cell / 2, y + cell * 0.63, cell * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export default function GameCanvas({ lane }: { lane: Lane }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [card, border, muted, film, projector, burnt, background, ink] =
    usePaletteColors(TOKENS);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== SIZE * dpr) canvas.width = canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = SIZE / COLUMNS;
    const rowH = SIZE / ROWS;

    // stage
    ctx.fillStyle = card;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    for (let c = 1; c < COLUMNS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cell, 0);
      ctx.lineTo(c * cell, SIZE);
      ctx.stroke();
    }
    ctx.fillStyle = muted;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, SIZE - rowH, SIZE, rowH);
    ctx.globalAlpha = 1;

    if (!lane.done) {
      drawFrame(
        ctx,
        lane.frameX * cell,
        lane.frameY * rowH,
        cell,
        lane.burnt ? burnt : film,
        lane.burnt ? ink : background,
        lane.burnt,
      );
    }
    drawProjector(
      ctx,
      lane.catcher * cell,
      SIZE - rowH,
      cell,
      projector,
      background,
    );
  });

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`Projector in column ${lane.catcher + 1}, ${lane.burnt ? "burnt" : "film"} frame falling in column ${lane.frameX + 1}`}
      className="game"
    />
  );
}
