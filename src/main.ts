import "./style.css";
import { mkSimplexNoise } from "./noise";
import Rand from "rand-seed";

type EtchParams = {
  x: number;
  y: number;
  length: number;
  width: number;
  kink: number;
  direction: number;
  lineColor: string;
  dotColor: string;
  drawDot: boolean;
  lineWidth: number;
  noiseFactor: number;
  noiseScale: number;
  position: number;
};

// const fps = 60;
const debug = false;
const record = false;
const drip = true;
const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
const noise = mkSimplexNoise(Math.random).noise2D;

const img = new Image();
img.src = "public/seas_logo.png";
img.onload = function () {};

let frame = 0;

function setup() {
  resizeCanvas();
  window.addEventListener("resize", () => resizeCanvas());
  draw();
}

function position(
  { x, y, kink, length, width, direction }: EtchParams,
  t: number
): [number, number] {
  const yKink = y + kink * length;
  const yWidth = yKink + width;
  const yt = y + t * length;
  let xt = x + width * direction;
  if (yt < yKink) {
    xt = x;
  } else if (yt < yWidth) {
    xt = x + direction * (yt - yKink);
  }
  return [xt, yt];
}

function etch(args: EtchParams) {
  ctx.lineCap = "round";
  ctx.lineJoin = "bevel";
  ctx.lineWidth = args.lineWidth;
  ctx.strokeStyle = args.lineColor;
  ctx.beginPath();
  ctx.moveTo(
    args.x +
      args.noiseFactor *
        noise(args.noiseScale * args.x, args.noiseScale * args.y),
    args.y
  );
  let [tx, ty] = [0, 0];
  const delta = 0.005;
  for (let t = 0; t <= 1; t += delta) {
    let [px, py] = position(args, t);
    px += args.noiseFactor * noise(args.noiseScale * px, args.noiseScale * py);
    if (t >= args.position && t < args.position + delta) {
      [tx, ty] = [px, py];
    }
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.save();
  if (args.drawDot) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = "white";
    if (drip) {
      if (tx !== 0 && ty !== 0) {
        ctx.ellipse(tx, ty, 7, 9, 0, 0, 2 * Math.PI);
      }
    } else {
      [tx, ty] = position(args, args.position);
      if (tx < 400 || tx > 765 || ty < 475 || ty > 615) {
        ctx.ellipse(tx, ty, 5, 9, 0, 0, 2 * Math.PI);
      }
    }
    ctx.fillStyle = args.dotColor;
    ctx.fill();
  }
  ctx.restore();
}

function draw() {
  const prng = new Rand("12");
  const t = (frame / 200) % 1;
  ctx.fillStyle = "#151530";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let x = 55;
  let dir1 = 1;
  let dir2 = 1;
  let dir3 = 1;
  while (x < canvas.width / 2 - 50) {
    dir1 = prng.next() > 0.5 ? 1 : -1;
    dir2 = prng.next() > 0.5 ? 1 : -1;
    dir2 = prng.next() > 0.5 ? 1 : -1;
    const flag = drip ? prng.next() : (prng.next() * (frame / 1)) % 1;
    let dotColor = "white";
    if (flag < 0.33) {
      dotColor = "#404040";
    } else if (flag < 0.67) {
      dotColor = "silver";
    }
    etch({
      x: x,
      y: 50 + prng.next() * 5,
      length: 250 - prng.next() * 10,
      width: 5,
      kink: prng.next(),
      direction: dir1,
      lineColor: "hsl(341, 90%, 35%)",
      dotColor: "#00000000",
      drawDot: false,
      lineWidth: 2.5,
      noiseFactor: 0,
      noiseScale: 0.01,
      position: 0,
    });
    etch({
      x: x,
      y: 350 + prng.next() * 5,
      length: 400 - prng.next() * 10,
      width: 10,
      kink: prng.next(),
      direction: dir2,
      lineColor: "slategray",
      dotColor: dotColor,
      position: drip ? (t + prng.next()) % 1 : prng.next(),
      drawDot: true,
      noiseFactor: 0,
      noiseScale: 0.01,
      lineWidth: 2.5,
    });
    etch({
      x: x,
      y: 800 + prng.next() * 5,
      length: 200 - prng.next() * 10,
      width: 5,
      kink: prng.next(),
      direction: dir3,
      lineColor: "hsl(210, 90%, 35%)",
      dotColor: "#00000000",
      position: 0,
      drawDot: false,
      lineWidth: 2.5,
      noiseFactor: 0,
      noiseScale: 0.01,
    });
    x += 4 + prng.next() * 2 + Math.max(dir1, 0) * 6;
  }

  ctx.font = "bold 24px arial";
  ctx.fillStyle = "#EDEDED";
  ctx.fillText("VIJAY KUMAR, Nemirovsky Family Dean", 650, 960);
  ctx.font = "bold 48px arial";
  ctx.fillStyle = "#EDEDED";
  ctx.fillText("Etching peace into your days", 265, 180);
  ctx.font = "bold 150px arial";
  ctx.fillStyle = "#FFFFFFA0";
  ctx.fillText("2024", 430, 600);
  ctx.drawImage(img, 100, 910);

  if (debug) {
    ctx.strokeStyle = "green";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 550);
    ctx.lineTo(1200, 550);
    ctx.moveTo(600, 0);
    ctx.lineTo(600, 1050);
    ctx.moveTo(50, 0);
    ctx.lineTo(50, 1050);
    ctx.moveTo(1150, 0);
    ctx.lineTo(1150, 1050);
    ctx.moveTo(0, 50);
    ctx.lineTo(1200, 50);
    ctx.moveTo(0, 1000);
    ctx.lineTo(1200, 1000);
    ctx.stroke();
  }
  if (frame > 0 && frame < 16 && record) {
    takeScreenshot(frame);
  }
  frame += 1;
  window.requestAnimationFrame(draw);
}

function resizeCanvas() {
  const windowWidth = 1200;
  const windowHeight = 1050;

  canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
  canvas.height = Math.floor(windowHeight * window.devicePixelRatio);

  canvas.style.width = windowWidth + "px";
  canvas.style.height = windowHeight + "px";

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function dataURIToBlob(dataURI: any) {
  const binStr = window.atob(dataURI.split(",")[1]);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new window.Blob([arr]);
}

function saveDataURI(name: string, dataURI: any) {
  const blob = dataURIToBlob(dataURI);

  // force download
  const link = document.createElement("a");
  link.download = name;
  link.href = window.URL.createObjectURL(blob);
  link.onclick = () => {
    window.setTimeout(() => {
      window.URL.revokeObjectURL(blob as any);
      link.removeAttribute("href");
    }, 500);
  };
  link.click();
}

function defaultFileName(frame: number, ext: string) {
  let n = pad(frame, 3);
  console.log(n);
  const str = `frame${n}${ext}`;
  return str.replace(/\//g, "-").replace(/:/g, ".");
}

function takeScreenshot(frame: number) {
  if (!ctx || !canvas) {
    return;
  }
  const DataURI = canvas.toDataURL("image/png");
  saveDataURI(defaultFileName(frame, ".png"), DataURI);
}

function pad(num: number, size: number): string {
  let numStr = num.toString();
  while (numStr.length < size) numStr = "0" + numStr;
  return numStr;
}

setup();
