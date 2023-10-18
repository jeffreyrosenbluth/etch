import "./style.css";
import Rand from "rand-seed";
import GUI from "lil-gui";

type Direction = -1 | 1;

type EtchParams = {
  x: number;
  y: number;
  length: number;
  width: number;
  kink: number;
  direction: Direction;
  lineColor: string;
  dotColor?: string;
  lineWidth: number;
  position: number;
};

const tweaks = {
  debug: false,
  drip: true,
  steps: 200,
  color1: "#a0081d",
  color2: "#BE8304",
  color3: "#a0081d",
};
const record = false;

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
let frame = 0;

// Import the Penn Engineering logo amd wait for it to load.
const img = new Image();
img.src = "public/seas_logo.png";
img.onload = function () {
  setup();
};

function setup() {
  const gui = new GUI();
  gui.add(tweaks, "debug");
  gui.add(tweaks, "drip");
  gui.add(tweaks, "steps", 1, 500, 10);
  gui.addColor(tweaks, "color1");
  gui.addColor(tweaks, "color2");
  gui.addColor(tweaks, "color3");

  const windowWidth = 1200;
  const windowHeight = 1050;
  canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
  canvas.height = Math.floor(windowHeight * window.devicePixelRatio);
  canvas.style.width = windowWidth + "px";
  canvas.style.height = windowHeight + "px";
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  draw();
}

function get_position(args: EtchParams, t: number): [number, number] {
  const { x, y, kink, length, width, direction } = args;
  const yStartKink = y + kink * length;
  const yEndKink = yStartKink + width;
  const yt = y + t * length;
  let xt = x + width * direction;
  if (yt < yStartKink) {
    xt = x;
  } else if (yt < yEndKink) {
    xt = x + direction * (yt - yStartKink);
  }
  return [xt, yt];
}

// Draw a single etched line with an optional bead.
function etch(args: EtchParams) {
  let { x, y, lineWidth, lineColor, dotColor, position } = args;
  ctx.lineCap = "round";
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  let [tx, ty] = [0, 0];
  const delta = 0.005;

  for (let t = 0; t <= 1; t += delta) {
    let [px, py] = get_position(args, t);
    if (t >= position && t < position + delta) {
      [tx, ty] = [px, py];
    }
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();

  // If the dotColor is provided draw the bead.
  ctx.save();
  if (dotColor) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = "white";
    if (tweaks.drip) {
      if (tx !== 0 && ty !== 0) {
        ctx.ellipse(tx, ty, 6, 9, 0, 0, 2 * Math.PI);
      }
    } else {
      [tx, ty] = get_position(args, position);
      if (tx < 400 || tx > 765 || ty < 475 || ty > 615) {
        ctx.ellipse(tx, ty, 6, 9, 0, 0, 2 * Math.PI);
      }
    }
    ctx.fillStyle = dotColor;
    ctx.fill();
  }
  ctx.restore();
}

function draw() {
  // A seeded random number generator.
  const prng = new Rand("Penn Engineering");

  const t = (frame / tweaks.steps) % 1;

  // Draw the background.
  const gradient = ctx.createLinearGradient(0, 0, 0, 1050);
  gradient.addColorStop(0, "silver");
  gradient.addColorStop(0.2, "#303060");
  gradient.addColorStop(0.5, "#101020");
  gradient.addColorStop(0.8, "#303060");
  gradient.addColorStop(1, "silver");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = 55;
  let dir: Direction;
  while (x < canvas.width / 2 - 50) {
    dir = prng.next() > 0.5 ? 1 : -1;
    const flag = tweaks.drip ? prng.next() : (prng.next() * (frame / 1)) % 1;
    let dotColor = "white";
    if (flag < 0.33) {
      dotColor = "#404040";
    } else if (flag < 0.67) {
      dotColor = "silver";
    }

    let etchParams: EtchParams = {
      x: x,
      y: 50 + prng.next() * 5,
      length: 250 - prng.next() * 10,
      width: 5,
      kink: prng.next(),
      direction: prng.next() > 0.5 ? 1 : -1,
      lineColor: tweaks.color1,
      lineWidth: 2.5,
      position: 0,
    };
    etch(etchParams);

    etchParams = {
      ...etchParams,
      y: 350 + prng.next() * 5,
      length: 400 - prng.next() * 10,
      width: 10,
      kink: prng.next(),
      direction: dir,
      lineColor: tweaks.color2,
      dotColor: dotColor,
      position: tweaks.drip ? (t + prng.next()) % 1 : prng.next(),
    };
    etch(etchParams);

    etchParams = {
      ...etchParams,
      y: 800 + prng.next() * 5,
      length: 200 - prng.next() * 10,
      width: 5,
      kink: prng.next(),
      direction: prng.next() > 0.5 ? 1 : -1,
      lineColor: tweaks.color3,
      position: 0,
      dotColor: undefined,
    };
    etch(etchParams);

    x += 4 + prng.next() * 2 + Math.max(dir, 0) * 6;
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

  if (tweaks.debug) {
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

  if (frame < 200 && record) {
    takeScreenshot(frame);
  }
  frame += 1;

  window.requestAnimationFrame(draw);
}

// Functions to save the frames as images.
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
