import type { UUID } from "crypto";
import type { CustomFlavorsType } from "../../contexts/CustomFlavors";
import { contrastColor, convertCustomFlavorToRenderer, darkenIfBright, loadImage, starMask, type FlavorRenderer } from "../FlavorUtils";
import { deleteResourceWithName, getAllResources, saveResourceWithName } from "../ResourceSaver";
import CustomFlavorServerManager from "../customFlavorMenu/CustomFlavorServerManager";
import type { User } from "../../@types/User";

export async function loadAllCustomFlavorsAsMusicPlayer(user: User | null, setCustomFlavors: (v: CustomFlavor[] | ((s: CustomFlavor[]) => CustomFlavor[])) => void) {
    const allFlavors = await getAllResources("customFlavors") as CustomFlavor[];

    const serversideFlavors = !!user ? await CustomFlavorServerManager.getAllCustomFlavors(user, allFlavors) : allFlavors;
    setCustomFlavors(serversideFlavors);

    for (const flavor of serversideFlavors) {
        CUSTOM_FLAVORS_RENDERERS.push(convertCustomFlavorToRenderer(flavor))
    }
    return serversideFlavors;
}

export async function addCustomFlavor(user: User | null, flavor: CustomFlavor, customFlavors: CustomFlavorsType) {
    customFlavors.setCustomFlavors(flavors => [...flavors, flavor]);
    if (!user) await saveResourceWithName("customFlavors", flavor.name, flavor);

    CUSTOM_FLAVORS_RENDERERS.push({
        colors: flavor.colors,
        imageObj: loadImage(flavor.image),
        image: flavor.image,
        name: flavor.name,
        uuid: flavor.uuid,
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

export async function deleteCustomFlavor(flavor: CustomFlavor, customFlavors: CustomFlavorsType) {
    CUSTOM_FLAVORS_RENDERERS = CUSTOM_FLAVORS_RENDERERS.filter(e => e.name !== flavor.name);
    customFlavors.setCustomFlavors(flavors => flavors.filter(e => e.name !== flavor.name));
    await deleteResourceWithName("customFlavors", flavor.name);
}

export async function updateCustomFlavor(user: User | null, newCustomFlavor: CustomFlavor, customFlavors: CustomFlavorsType) {
    CUSTOM_FLAVORS_RENDERERS = CUSTOM_FLAVORS_RENDERERS.map(e => {
        if (e.uuid !== newCustomFlavor.uuid) return e;
        return {
            colors: newCustomFlavor.colors,
            imageObj: loadImage(newCustomFlavor.image),
            image: newCustomFlavor.image,
            name: newCustomFlavor.name,
            uuid: newCustomFlavor.uuid,
            contrastColor: contrastColor(darkenIfBright(newCustomFlavor.colors[0])),
            bgColor: darkenIfBright(newCustomFlavor.colors[0]),
            renderBackgroundMask: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
                if (!starMask.complete) return;

                if (!isFinite(w) || !isFinite(h)) return;

                const off = new OffscreenCanvas(w, h);

                const octx = off.getContext("2d");
                if (!octx || w == 0) return;
                octx.save();


                // 1) Draw solid background color
                octx.fillStyle = newCustomFlavor.colors[0];
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
        };
    });
    if (!user) await saveResourceWithName("customFlavors", newCustomFlavor.name, newCustomFlavor);

    customFlavors.setCustomFlavors(flavors => [...flavors.map(e => {
        if (e.uuid !== newCustomFlavor.uuid) return e;
        console.log("Found", e, newCustomFlavor);
        return { ...newCustomFlavor };
    })]);
}

export type CustomFlavor = {
    name: string;
    audio: string;
    image: string;
    colors: [string, string, string];
    isPublic: boolean;
    uuid: UUID;
}

let CUSTOM_FLAVORS_RENDERERS: FlavorRenderer[] = (window as any).CUSTOM_FLAVORS_RENDERERS ?? [];
(window as any).CUSTOM_FLAVORS_RENDERERS = CUSTOM_FLAVORS_RENDERERS;

export { CUSTOM_FLAVORS_RENDERERS };