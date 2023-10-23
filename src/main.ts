import "./style.css";
import Rand from "rand-seed";
import GUI from "lil-gui";

type Direction = -1 | 1;

type EtchParams = {
  x: number;
  y: number;
  length: number;
  width: number;
  kink1: number;
  kink2: number;
  direction1: Direction;
  direction2: Direction;
  lineColor: string;
  dotColor?: string;
  lineWidth: number;
  position: number;
};

const record = false;
const tweaks = {
  debug: false,
  steps: record ? 200 : 500,
  etchColor: "#aeb1c2",
  textColor1: "#cf172f",
  textColor2: "#ffffff",
  bgColor: "#121224",
  ratio: 0.5,
};

const width = Math.floor(1200 * window.devicePixelRatio);
const height = Math.floor(1050 * window.devicePixelRatio);
const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
const offCanvas = new OffscreenCanvas(width, height);
const offCtx = offCanvas.getContext("2d", { willReadFrequently: true })!;

canvas.width = width;
canvas.height = height;
canvas.style.width = "1200px";
canvas.style.height = "1050px";
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
offCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

let result: number[][] = Array.from({ length: width * height }, () =>
  Array(3).fill(0)
);

let t = 0;
let c = 0;
let samplesPerFrame = 5;
let numFrames = 80;
let shutterAngle = 0.5;
let frameCount = 0;

let frame = 0;
// let backGround: OffscreenCanvas;

// Import the Penn Engineering logo amd wait for it to load.
const img = new Image();
img.src = "public/UPenn_Logo_Reverse_225.png";
img.onload = function () {
  setup();
};

function setup() {
  const gui = new GUI();
  gui.add(tweaks, "debug");
  gui.add(tweaks, "steps", 1, 500, 10);
  gui.addColor(tweaks, "etchColor");
  gui.addColor(tweaks, "textColor1");
  gui.addColor(tweaks, "textColor2");
  gui.addColor(tweaks, "bgColor");
  gui.add(tweaks, "ratio", 0, 1, 0.05);
  gui.close();

  draw();
}

function get_position(args: EtchParams, t: number): [number, number] {
  const { x, y, kink1, kink2, length, width, direction1, direction2 } = args;
  const yStartKink1 = y + kink1 * length;
  const yEndKink1 = yStartKink1 + width;
  const yStartKink2 = y + kink2 * length;
  const yEndKink2 = yStartKink2 + width;
  const yt = y + t * length;
  let xt = x + width * direction1;
  if (yt < yStartKink1) {
    xt = x;
  } else if (yt < yEndKink1) {
    xt = x + direction1 * (yt - yStartKink1);
  } else if (yt < yStartKink2 || yStartKink2 <= yEndKink1) {
    xt = x + direction1 * width;
  } else if (yt < yEndKink2) {
    xt = x + direction1 * width + direction2 * (yt - yStartKink2);
  } else {
    xt = x + direction1 * width + direction2 * width;
  }
  return [xt, yt];
}

// Draw a single etched line with an optional bead.
function etch(args: EtchParams) {
  let { x, y, lineWidth, lineColor, dotColor, position } = args;
  offCtx.lineCap = "round";
  offCtx.lineWidth = lineWidth;
  offCtx.strokeStyle = lineColor;
  offCtx.beginPath();
  offCtx.moveTo(x, y);
  let [tx, ty] = [0, 0];
  const delta = 0.005;

  for (let t = 0; t <= 1; t += delta) {
    let [px, py] = get_position(args, t);
    if (t >= position && t < position + delta) {
      [tx, ty] = [px, py];
    }
    offCtx.lineTo(px, py);
  }
  offCtx.stroke();
  offCtx.beginPath();

  // If the dotColor is provided draw the bead.
  offCtx.save();
  if (dotColor) {
    [tx, ty] = get_position(args, position);
    if (tx < 400 || tx > 765 || ty < 475 || ty > 615) {
      offCtx.ellipse(tx, ty, 6, 9, 0, 0, 2 * Math.PI);
    }
    offCtx.fillStyle = dotColor;
    offCtx.fill();
  }
  offCtx.restore();
}

function etchRow(
  x0: number,
  y0: number,
  length0: number,
  width0: number,
  dot: boolean = false,
  t: number,
  color: string,
  prng: Rand
) {
  let x = x0;
  while (x < canvas.width / 2 - 50) {
    const direction1 = prng.next() > 0.5 ? 1 : -1;
    const direction2 = prng.next() > 0.5 ? 1 : -1;
    const width = width0 * (2 + prng.next());
    const flag = prng.next();
    let dotColor = "white";
    if (flag < 0.5) {
      dotColor = "silver";
    }
    let etchParams: EtchParams = {
      x,
      y: y0 + prng.next() * 5,
      length: length0 - prng.next() * 10,
      width,
      kink1: 0.75 * prng.next(),
      kink2: prng.next(),
      direction1,
      direction2,
      lineColor: color,
      lineWidth: 4,
      position: (t + prng.next()) % 1,
      dotColor: dot ? dotColor : undefined,
    };
    etch(etchParams);
    x += Math.min(
      1.0 * width,
      (prng.next() + Math.max(direction1 + direction2, 0.2)) * width
    );
  }
}

function draw_() {
  // Calculate elapsed time since the last frame
  // A seeded random number generator.
  const prng = new Rand("Penn Engineering Holiday Card");
  // t goes from 0 to 1 used to positon the dot at as time moves.
  const t = (frame / tweaks.steps) % 1;

  // if (tweaks.grain) {
  // ctx.drawImage(backGround, 0, 0);
  // } else {
  offCtx.fillStyle = tweaks.bgColor;
  offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
  // }

  const x = 1200 * tweaks.ratio + 20;

  etchRow(x, 50, 950, 8, true, t, tweaks.etchColor, prng);

  // ctx.font = "bold italic 48px arial";
  offCtx.font = "italic 52px Merriweather";
  offCtx.fillStyle = tweaks.textColor1;
  offCtx.fillText("Etching Peace", 50, 525 - 70);
  offCtx.font = "italic 44px Merriweather";
  offCtx.fillText("into your New Year", 50, 505);
  offCtx.font = "22px Merriweather Sans";
  offCtx.fillText("VIJAY KUMAR, Nemirovsky Family Dean", 50, 575);

  const down = 150;
  offCtx.font = "bold 34px Merriweather Sans";
  offCtx.fillStyle = tweaks.textColor2;
  offCtx.fillText("2024", 355, 750 + down);

  offCtx.drawImage(img, 50, 700 + down);

  offCtx.fillStyle = "white";
  offCtx.lineWidth = 1;
  offCtx.beginPath();
  offCtx.moveTo(50, 795 + down);
  offCtx.lineTo(455, 795 + down);
  offCtx.stroke();

  offCtx.font = "300 15px Merriweather Sans";
  offCtx.fillText(
    "Artwork inspired by the glass etchings of Amy",
    50,
    822 + down
  );
  // offCtx.fillText("Gutmann Hall, by Jeffrey M. Rosenbluth Phd", 50, 825 + down);
  offCtx.fillText("Gutmann Hall.", 50, 840 + down);

  if (tweaks.debug) {
    offCtx.strokeStyle = "green";
    offCtx.lineWidth = 1;
    offCtx.beginPath();
    offCtx.moveTo(1200 * tweaks.ratio, 0);
    offCtx.lineTo(1200 * tweaks.ratio, 1050);
    offCtx.moveTo(50, 0);
    offCtx.lineTo(50, 1050);
    offCtx.moveTo(1150, 0);
    offCtx.lineTo(1150, 1050);
    offCtx.moveTo(0, 50);
    offCtx.lineTo(1200, 50);
    offCtx.moveTo(0, 1000);
    offCtx.lineTo(1200, 1000);
    offCtx.moveTo(0, tweaks.ratio * 1050);
    offCtx.lineTo(1200, tweaks.ratio * 1050);
    offCtx.stroke();
  }

  // if (frame > -1 && frame < 200 && record) {
  //   takeScreenshot(frame);
  // }
  frame += 1;

  // if (record) {
  //   setTimeout(() => {
  //     requestAnimationFrame(draw);
  //   }, 100);
  // } else {
  //   window.requestAnimationFrame(draw);
  // }
}

// Functions to save the frames as images.
// This is a bit of a hack but it works.
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
  if (!offCtx || !canvas) {
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

function map(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number,
  constr: boolean
) {
  let value = ((x - a) / (b - a)) * (d - c) + c;
  if (constr) {
    return Math.min(Math.max(value, Math.min(c, d)), Math.max(c, d));
  }
  return value;
}

function draw() {
  offCtx.clearRect(0, 0, width, height);

  // Reset result array
  for (let i = 0; i < width * height; i++) {
    for (let a = 0; a < 3; a++) {
      result[i][a] = 0;
    }
  }

  for (let sa = 0; sa < samplesPerFrame; sa++) {
    t = map(
      frameCount - 1 + (sa * shutterAngle) / samplesPerFrame,
      0,
      numFrames,
      0,
      1,
      false
    );

    t %= 1;
    draw_();
    let imageData = offCtx.getImageData(0, 0, width, height);
    let pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      let idx = i / 4;
      result[idx][0] += pixels[i];
      result[idx][1] += pixels[i + 1];
      result[idx][2] += pixels[i + 2];
    }
  }

  let imageData = ctx.createImageData(width, height);
  let pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    let idx = i / 4;
    pixels[i] = result[idx][0] / samplesPerFrame;
    pixels[i + 1] = result[idx][1] / samplesPerFrame;
    pixels[i + 2] = result[idx][2] / samplesPerFrame;
    pixels[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(draw);
}
