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
  drip: true,
  steps: record ? 200 : 400,
  etchColor: "#8a8c99",
  textColor1: "#9f2132",
  textColor2: "#ffffff",
  bgColor: "#121224",
  glow: 15,
};

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
let frame = 0;

// Import the Penn Engineering logo amd wait for it to load.
const img = new Image();
img.src = "public/UPenn_Logo_Reverse_225.png";
img.onload = function () {
  setup();
};

function setup() {
  const gui = new GUI();
  gui.add(tweaks, "debug");
  gui.add(tweaks, "drip");
  gui.add(tweaks, "steps", 1, 500, 10);
  gui.addColor(tweaks, "etchColor");
  gui.addColor(tweaks, "textColor1");
  gui.addColor(tweaks, "textColor2");
  gui.addColor(tweaks, "bgColor");
  gui.add(tweaks, "glow", 0, 50, 1);

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
    ctx.shadowBlur = tweaks.glow;
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

function draw() {
  // Calculate elapsed time since the last frame
  // A seeded random number generator.
  const prng = new Rand("Penn Engineering Holiday Card");
  // t goes from 0 to 1 used to positon the dot at as time moves.
  const t = (frame / tweaks.steps) % 1;

  ctx.fillStyle = tweaks.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const x = 1200 * 0.382 + 20;

  etchRow(x, 50, 950, 8, true, t, tweaks.etchColor, prng);

  // ctx.font = "bold italic 48px arial";
  ctx.font = "bold italic 48px lato";
  ctx.fillStyle = tweaks.textColor1;
  ctx.fillText("Etching Peace", 50, 525 - 70);
  ctx.font = "italic 40px lato";
  ctx.fillText("into your New Year", 50, 505);
  ctx.font = "20px lato";
  ctx.fillText("VIJAY KUMAR, Nemirovsky Family Dean", 50, 575);

  const down = 150;
  ctx.font = "bold 36px lato";
  ctx.fillStyle = tweaks.textColor2;
  ctx.fillText("2024", 315, 750 + down);

  ctx.drawImage(img, 50, 700 + down);

  ctx.fillStyle = "white";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 795 + down);
  ctx.lineTo(400, 795 + down);
  ctx.stroke();

  ctx.font = "15px lato";
  ctx.fillText("Artwork inspired by the glass etchings of Amy", 50, 825 + down);
  // ctx.fillText("Gutmann Hall, by Jeffrey M. Rosenbluth Phd", 50, 843);
  ctx.fillText("Gutmann Hall.", 50, 843 + down);

  if (tweaks.debug) {
    ctx.strokeStyle = "green";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1200 * 0.382, 0);
    ctx.lineTo(1200 * 0.382, 1050);
    ctx.moveTo(50, 0);
    ctx.lineTo(50, 1050);
    ctx.moveTo(1150, 0);
    ctx.lineTo(1150, 1050);
    ctx.moveTo(0, 50);
    ctx.lineTo(1200, 50);
    ctx.moveTo(0, 1000);
    ctx.lineTo(1200, 1000);
    ctx.moveTo(0, 0.382 * 1050);
    ctx.lineTo(1200, 0.382 * 1050);
    ctx.stroke();
  }

  if (frame > -1 && frame < 200 && record) {
    takeScreenshot(frame);
  }
  frame += 1;

  if (record) {
    setTimeout(() => {
      requestAnimationFrame(draw);
    }, 100);
  } else {
    window.requestAnimationFrame(draw);
  }
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
