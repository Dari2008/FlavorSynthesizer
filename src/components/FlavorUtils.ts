import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../@types/Flavors";
import type { FlavorElement } from "./flavorSynth/PlayerTrack";

export const STROKES_COLORS = "white";
export const UNIT = "s";

export const FLAVOR_HEIGHT = 45;
export const LINE_MARKER_HEIGHT = 10;
export const LINE_Y = 30;
export const MARGIN_BETWEEN_SCALE_AND_FLAVORS = 10;
export const TOTAL_SYNTH_HEIGHT = FLAVOR_HEIGHT + LINE_MARKER_HEIGHT + LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS;

var pixelsPerSecond = 100;
var span = { from: 0, to: 10 };
var offsetX = 0;

export function getFlavorHeight() {
    return FLAVOR_HEIGHT;
}

export function getPixelsPerSecond() {
    return pixelsPerSecond;
}

export function getSpan() {
    return span;
}

export function getOffsetX() {
    return offsetX;
}

export function setSpan(width: number, s: { from: number; to: number; }) {
    pixelsPerSecond = width / (span.to - span.from);
    span = s;
    offsetX = span.from * pixelsPerSecond;
}

export function setPixelsPerSecond(pps: number) {
    pixelsPerSecond = pps;
}

export function convertTimelineXToScreen(x: number) {
    return x - offsetX;
}

export function calculateCurrentPosSeconds(x: number) {
    const timelineX = convertScreenXToTimeline(x);
    const seconds = timelineX / pixelsPerSecond;
    return Math.round(seconds);
}

export function convertScreenXToTimeline(x: number) {
    return x + offsetX;
}

export function constrainSpan(s: { from: number; to: number; }): { from: number; to: number; } {
    const minSpan = 0;
    const maxSpan = 10 * 60;

    s.from = Math.max(minSpan, s.from);

    if (s.to > maxSpan) {
        const dist = s.to - s.from;
        s.to = maxSpan;
        s.from = maxSpan - dist;
    }

    if (s.to - s.from < 1) {
        s.to = s.from + 1;
    }

    return s;
}


export function createElementForFlavor(flavor: Flavor, from: number, to: number): FlavorElement {
    const d: FlavorElement = {
        from: from,
        to: to,
        uuid: crypto.randomUUID(),
        flavor: {
            colors: FLAVOR_COLOR[flavor],
            imageObj: loadImage(FLAVOR_IMAGES[flavor]),
            image: FLAVOR_IMAGES[flavor],
            name: flavor,
            contrastColor: contrastColor(darkenIfBright(FLAVOR_COLOR[flavor][0])),
            bgColor: darkenIfBright(FLAVOR_COLOR[flavor][0])
        }
    }
    return d;
}


export function drawElement(element: FlavorElement, ctx: CanvasRenderingContext2D, xOffset: number = 0, offsetY: number = 0, isSelected: boolean = false): boolean {
    const fromPos = element.from * pixelsPerSecond;
    const toPos = element.to * pixelsPerSecond;
    const width = toPos - fromPos;
    const imageMargin = 10;
    const rectHeight = FLAVOR_HEIGHT;
    const y = offsetY;
    const imageSize = Math.min(width - imageMargin * 2, rectHeight - imageMargin * 2);
    fillRoundedRect(fromPos - xOffset, y, width, rectHeight, 10, element.flavor.bgColor);

    if (isSelected) {
        ctx.lineWidth = 4;
        drawRoundedRect(fromPos + imageMargin / 2 - xOffset, y + imageMargin / 2, imageSize + imageMargin, imageSize + imageMargin, 10, "rgb(0, 255, 149)");
    }

    fillRoundedRect(fromPos + imageMargin / 2 - xOffset, y + imageMargin / 2, imageSize + imageMargin, imageSize + imageMargin, 10, "rgb(40, 40, 40)");

    ctx.drawImage(element.flavor.imageObj, fromPos + imageMargin - xOffset, y + imageMargin, imageSize, imageSize);

    if (ctx.measureText(element.flavor.name).width + imageSize + imageMargin * 2 + 10 > width) {
        return false;
    }

    const textX = imageSize + imageMargin * 2 + fromPos;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "15px Arial";
    ctx.fillStyle = element.flavor.contrastColor;
    ctx.fillText(element.flavor.name, textX + 5 - xOffset, y + rectHeight / 2);
    return true;

    function drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: string = "black") {
        if (ctx) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.stroke();
        }
    }

    function fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: string = "black") {
        if (ctx) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.fill();
        }
    }
}


function loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img
}

function parseTime(time: string): number {
    const parts = time.split(":");
    console.log(parts);
    switch (parts.length) {
        case 1:
            return parseInt(parts[0]);
        case 2:
            return parseInt(parts[1]) + parseInt(parts[0]) * 60;
        case 3:
            return parseInt(parts[2]) + parseInt(parts[1]) * 60 + parseInt(parts[0]) * 60 * 60;
    }
    return -1;
}


function contrastColor(hex: string): string {
    // Remove leading '#'
    hex = hex.replace("#", "");

    // Support shorthand #RGB
    if (hex.length === 3) {
        hex = hex.split("").map(ch => ch + ch).join("");
    }

    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const srgb = [r, g, b].map((c) => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    // Relative luminance
    const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];

    // If luminance is high, use dark text; otherwise light text
    return luminance > 0.179 ? "#000000" : "#FFFFFF";
}


function darkenIfBright(hex: string, amount: number = 0.6): string {
    hex = hex.replace("#", "");

    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // brightness formula (0 - 255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness <= 125) {
        return `#${hex}`;
    }

    const darken = (v: number) => Math.max(0, Math.round(v * (1 - amount)));

    const newR = darken(r);
    const newG = darken(g);
    const newB = darken(b);

    const toHex = (v: number) => v.toString(16).padStart(2, "0");

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
