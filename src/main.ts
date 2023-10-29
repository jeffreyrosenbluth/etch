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
  dotColor: string;
  dotSize: number;
  lineWidth: number;
  position: number;
};

const record = false;
const PennRed = "#990000";
const PennBlue = "#010F5B";
const EtchGray = "#aeb1c2";

const tweaks = {
  guides: false,
  steps: record ? 200 : 500,
  etchColor: "#ffffff", // aeb1c2
  messageColor: PennBlue, //b30015
  footnoteColor: PennBlue, // #f5f5f5
  bgColor1: "#daeefb",
  bgColor2: "#56b5f0",
  bgOpacity: 0.85,
  dotColor: PennRed,
  dotSize: 8.5,
  snowSize: 8,
  logo: "Dark",
  snow: false,
  ratio: 0.5,
};

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
const colors = ["white", "#096dda", "#00be43", "#f90302", "#fc5401", "#6d51f2"];

let frame = 0;

// Import the Penn Engineering logo amd wait for it to load.
const logoLight = new Image();
const logoDark = new Image();
const agh = new Image();
logoDark.src = "UPenn_Logo_RGB_225.png";
logoLight.src = "UPenn_Logo_Reverse_225.png";
agh.src = "agh_south_rendering.jpg";

agh.onload = function () {
  loadDarkLogo();
};

logoDark.onload = function () {
  loadLightLogo();
};

function loadDarkLogo() {
  logoDark.onload = function () {
    loadLightLogo();
  };
}

function loadLightLogo() {
  logoLight.onload = function () {
    setup();
  };
}

function setup() {
  const gui = new GUI();
  gui.add(tweaks, "steps", 1, 500, 10).name("Steps");
  gui.addColor(tweaks, "etchColor").name("Etch Color");
  gui.addColor(tweaks, "messageColor").name("Message Color");
  gui.addColor(tweaks, "footnoteColor").name("Footnote Color");
  gui.addColor(tweaks, "bgColor1").name("Background Color 1");
  gui.addColor(tweaks, "bgColor2").name("Background Color 2");
  gui.add(tweaks, "bgOpacity", 0, 1, 0.01).name("Background Opacity");
  gui.addColor(tweaks, "dotColor").name("Dot Color");
  gui.add(tweaks, "dotSize", 1, 20, 0.5).name("Dot Size");
  gui.add(tweaks, "snow").name("Snow");
  gui.add(tweaks, "snowSize", 1, 20, 0.5).name("Snow Size");
  gui.add(tweaks, "logo", ["Light", "Dark"]).name("Logo");
  gui.add(tweaks, "guides").name("Guides");

  gui.close();

  const windowWidth = 1200;
  const windowHeight = 900;
  canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
  canvas.height = Math.floor(windowHeight * window.devicePixelRatio);
  canvas.style.width = windowWidth + "px";
  canvas.style.height = windowHeight + "px";
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  ctx.save();
  ctx.fillStyle = tweaks.bgColor2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
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
  let { x, y, lineWidth, lineColor, dotColor, dotSize, position } = args;
  ctx.lineCap = "round";
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  let [tx, ty] = [0, 0];
  const delta = 0.005;

  for (let t = 0; t < 1; t += delta) {
    let [px, py] = get_position(args, t);
    if (t >= position && t < position + delta) {
      [tx, ty] = [px, py];
    }
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.save();
  [tx, ty] = get_position(args, position);
  ctx.ellipse(tx, ty, dotSize, dotSize, 0, 0, 2 * Math.PI);
  ctx.fillStyle = dotColor;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function etchRow(
  x0: number,
  y0: number,
  length0: number,
  width0: number,
  t: number,
  lineColor: string,
  dotColor: string,
  dotSize: number,
  stop: number,
  prng: Rand
) {
  let x = x0;
  while (x < stop) {
    const direction1 = prng.next() > 0.5 ? 1 : -1;
    const direction2 = prng.next() > 0.5 ? 1 : -1;
    const width = width0 * (2 + prng.next());
    let etchParams: EtchParams = {
      x,
      y: y0 + prng.next() * 5,
      length: length0 - prng.next() * 10,
      width,
      kink1: 0.75 * prng.next(),
      kink2: prng.next(),
      direction1,
      direction2,
      lineColor: lineColor,
      lineWidth: 3,
      position: (t + prng.next()) % 1,
      dotColor,
      // dotColor: colors[Math.floor(6 * prng.next())],
      dotSize,
    };
    etch(etchParams);
    x += Math.min(
      1.0 * width,
      (prng.next() + Math.max(direction1 + direction2, 0.2)) * width
    );
  }
}

function drawText() {
  const h = 350;
  ctx.font = "bold 62px Merriweather";
  ctx.fillStyle = tweaks.messageColor;
  ctx.fillText("Etching Peace", 50, h);
  ctx.font = "bold 50px Merriweather";
  ctx.fillText("into your New Year", 50, h + 68);
  ctx.font = "24px Merriweather Sans";
  ctx.fillText("VIJAY KUMAR, Nemirovsky Family Dean", 50, h + 130);

  const down = 140;
  ctx.font = "bold 34px Merriweather Sans";
  ctx.fillStyle = tweaks.footnoteColor;
  ctx.fillText("2024", 425, 600 + down);

  if (tweaks.logo === "Light") {
    ctx.drawImage(logoLight, 50, 550 + down);
  } else {
    ctx.drawImage(logoDark, 50, 550 + down);
  }

  ctx.strokeStyle = tweaks.footnoteColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 648 + down);
  ctx.lineTo(525, 648 + down);
  ctx.stroke();

  ctx.font = "400 15px Merriweather Sans";
  ctx.fillText(
    "Artwork inspired by the glass etchings of Amy Gutmann Hall.",
    50,
    822 - 140 + down
  );
  ctx.fillText("Designed by Jeffrey M Rosenbluth.", 50, 845 - 140 + down);
}

function draw() {
  // Calculate elapsed time since the last frame
  // A seeded random number generator.
  const prng = new Rand("Penn Engineering 002 White");
  // t goes from 0 to 1 used to positon the dot at as time moves.
  const t = (frame / tweaks.steps) % 1;

  ctx.drawImage(agh, 0, 0);
  const lg = ctx.createLinearGradient(0, 0, 1200, 900);
  lg.addColorStop(0, tweaks.bgColor1);
  lg.addColorStop(1, tweaks.bgColor2);
  // lg.addColorStop(1, "white");
  ctx.globalAlpha = tweaks.bgOpacity;
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, 1200, 1050);
  ctx.globalAlpha = 1.0;

  const x = 1200 * tweaks.ratio + 20;
  etchRow(
    x,
    50,
    800,
    8,
    t,
    tweaks.etchColor,
    tweaks.dotColor,
    tweaks.dotSize,
    canvas.width / 2 - 50,
    prng
  );
  if (tweaks.snow) {
    etchRow(
      50,
      50,
      800,
      8,
      t,
      "#00000000",
      tweaks.dotColor,
      tweaks.snowSize,
      canvas.width / 4,
      prng
    );
  }

  drawText();

  if (tweaks.guides) {
    ctx.strokeStyle = "green";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1200 * tweaks.ratio, 0);
    ctx.lineTo(1200 * tweaks.ratio, 1050);
    ctx.moveTo(50, 0);
    ctx.lineTo(50, 1050);
    ctx.moveTo(1150, 0);
    ctx.lineTo(1150, 1050);
    ctx.moveTo(0, 50);
    ctx.lineTo(1200, 50);
    ctx.moveTo(0, 850);
    ctx.lineTo(1200, 850);
    ctx.moveTo(0, tweaks.ratio * 900);
    ctx.lineTo(1200, tweaks.ratio * 900);
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
