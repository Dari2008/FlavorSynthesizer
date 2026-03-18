import type { CustomFlavorsType } from "../../contexts/CustomFlavors";
import { starMask, type FlavorRenderer } from "../FlavorUtils";
import { getAllResources, saveResourceWithName } from "../ResourceSaver";

export async function loadAllCustomFlavorsAsMusicPlayer(setCustomFlavors: (v: CustomFlavor[] | ((s: CustomFlavor[]) => CustomFlavor[])) => void) {
    const allFlavors = await getAllResources("customFlavors") as CustomFlavor[];
    setCustomFlavors(allFlavors);

    for (const flavor of allFlavors) {
        CUSTOM_FLAVORS_RENDERERS.push({
            colors: flavor.colors,
            imageObj: loadImage(flavor.image),
            image: flavor.image,
            name: flavor.flavorName,
            contrastColor: contrastColor(darkenIfBright(flavor.colors[0])),
            bgColor: darkenIfBright(flavor.colors[0]),
            renderBackgroundMask: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
                if (!starMask.complete) return;

                if (!isFinite(w) || !isFinite(h)) return;

                const off = new OffscreenCanvas(w, h);

                const octx = off.getContext("2d");
                if (!octx || w == 0) return;
                octx.save();


                // 1) Draw solid background color
                octx.fillStyle = flavor.colors[0];
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
        })
    }

}

export async function addCustomFlavor(flavor: CustomFlavor, customFlavors: CustomFlavorsType) {
    await saveResourceWithName("customFlavors", flavor.flavorName, flavor);
    customFlavors.setCustomFlavors(flavors => [...flavors, flavor]);
    saveResourceWithName("customFlavors", flavor.flavorName, flavor);


    CUSTOM_FLAVORS_RENDERERS.push({
        colors: flavor.colors,
        imageObj: loadImage(flavor.image),
        image: flavor.image,
        name: flavor.flavorName,
        contrastColor: contrastColor(darkenIfBright(flavor.colors[0])),
        bgColor: darkenIfBright(flavor.colors[0]),
        renderBackgroundMask: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
            if (!starMask.complete) return;

            if (!isFinite(w) || !isFinite(h)) return;

            const off = new OffscreenCanvas(w, h);

            const octx = off.getContext("2d");
            if (!octx || w == 0) return;
            octx.save();


            // 1) Draw solid background color
            octx.fillStyle = flavor.colors[0];
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
    })

}

export type CustomFlavor = {
    flavorName: string;
    audio: string;
    image: string;
    colors: [string, string, string];
}

export const CUSTOM_FLAVORS_RENDERERS: FlavorRenderer[] = [];

function loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img
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
