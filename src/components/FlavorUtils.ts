import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../@types/Flavors";
import { FLAVORS } from "../audio/Flavors";
import { STAR_MASK_IMAGE } from "../Images";
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

    const starMask = new Image();
    starMask.src = STAR_MASK_IMAGE;

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
            bgColor: darkenIfBright(FLAVOR_COLOR[flavor][0]),
            renderBackgroundMask: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
                if (!starMask.complete) return;


                const off = document.createElement("canvas");
                off.width = w;
                off.height = h;

                const octx = off.getContext("2d")!;
                octx.save();


                // 1) Draw solid background color
                octx.fillStyle = FLAVOR_COLOR[flavor][0];
                octx.fillRect(0, 0, w, h);

                // 2) Apply star mask
                octx.globalCompositeOperation = "destination-in";

                const pattern = octx.createPattern(starMask, "repeat");
                if (pattern) {
                    octx.fillStyle = pattern;
                    ctx.beginPath();
                    octx.roundRect(0, 0, w, h, 10);
                    octx.fill();
                    ctx.closePath();
                }

                octx.restore();


                ctx.drawImage(off, x, y);

            }
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
    drawBackgroundImage();

    drawBorder();

    if (isSelected) {
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(fromPos + imageMargin / 2 - xOffset, y + imageMargin / 2, imageSize + imageMargin, imageSize + imageMargin, 10);
        ctx.fillStyle = "rgb(0, 255, 149)";
        ctx.fill();
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.roundRect(fromPos + imageMargin / 2 - xOffset, y + imageMargin / 2, imageSize + imageMargin, imageSize + imageMargin, 10);
    ctx.fillStyle = "rgb(40, 40, 40)";
    ctx.fill();
    ctx.closePath();
    ctx.drawImage(element.flavor.imageObj, fromPos + imageMargin - xOffset, y + imageMargin, imageSize, imageSize);


    if (ctx.measureText(element.flavor.name.toUpperCase()).width + imageSize + imageMargin * 2 + 10 > width) {
        return false;
    }

    const textX = imageSize + imageMargin * 2 + fromPos;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "500 15px Arial";
    ctx.fillStyle = element.flavor.contrastColor;
    ctx.fillText(element.flavor.name.toUpperCase(), textX + 5 - xOffset, y + rectHeight / 2);
    return true;

    function drawBorder() {
        drawGradientBorder(fromPos - xOffset, y, width, rectHeight, 10, 2, element.flavor.colors[0], element.flavor.colors[1])
        function drawGradientBorder(
            x: number,
            y: number,
            width: number,
            height: number,
            radius: number,
            borderWidth: number,
            color1: string,
            color2: string
        ) {
            // create offscreen canvas
            const off = document.createElement("canvas");
            off.width = width;
            off.height = height;

            const octx = off.getContext("2d")!;

            // create gradient
            const grad = octx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, "white");
            grad.addColorStop(0.01, color1)
            grad.addColorStop(1, mixColor(color2, "black", 0.2));

            // draw outer rounded rect
            const outer = new Path2D();
            roundedRectPath(outer, 0, 0, width, height, radius);

            // draw inner rounded rect
            const inner = new Path2D();
            roundedRectPath(
                inner,
                borderWidth,
                borderWidth,
                width - borderWidth * 2,
                height - borderWidth * 2,
                radius - borderWidth
            );

            // fill outer with gradient
            octx.fillStyle = grad;
            octx.fill(outer);

            // cut out inner
            octx.globalCompositeOperation = "destination-out";
            octx.fill(inner);

            // draw offscreen onto main ctx
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(off, x, y);
        }

        function roundedRectPath(
            path: Path2D,
            x: number,
            y: number,
            w: number,
            h: number,
            r: number
        ) {
            const radius = Math.min(r, w / 2, h / 2);

            path.moveTo(x + radius, y);
            path.lineTo(x + w - radius, y);
            path.quadraticCurveTo(x + w, y, x + w, y + radius);
            path.lineTo(x + w, y + h - radius);
            path.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            path.lineTo(x + radius, y + h);
            path.quadraticCurveTo(x, y + h, x, y + h - radius);
            path.lineTo(x, y + radius);
            path.quadraticCurveTo(x, y, x + radius, y);
        }
    }

    function drawBackgroundImage() {
        element.flavor.renderBackgroundMask(ctx, fromPos - xOffset, y, width, rectHeight);
    }

}

function mixColor(a: string, b: string, ratio: number): string {
    const c1 = parseColor(a);
    const c2 = parseColor(b);

    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b2 = Math.round(c1.b + (c2.b - c1.b) * ratio);

    return `rgb(${r}, ${g}, ${b2})`;
}

function parseColor(color: string) {
    color = color.trim();

    // HEX #RRGGBB or #RGB
    if (color.startsWith("#")) {
        color = color.slice(1);
        if (color.length === 3) {
            color = color.split("").map(c => c + c).join("");
        }
        const r = parseInt(color.slice(0, 2), 16);
        const g = parseInt(color.slice(2, 4), 16);
        const b = parseInt(color.slice(4, 6), 16);
        return { r, g, b };
    }

    // rgb(r,g,b)
    let match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
        return { r: +match[1], g: +match[2], b: +match[3] };
    }

    // rgba(r,g,b,a)
    match = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
    if (match) {
        return { r: +match[1], g: +match[2], b: +match[3] };
    }

    // fallback
    return { r: 0, g: 0, b: 0 };
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
