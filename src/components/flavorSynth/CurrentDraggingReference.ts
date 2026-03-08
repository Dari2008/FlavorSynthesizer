import type { Flavor } from "../../@types/Flavors";

type Dragging = {
    flavor: Flavor;
    offsetImage: Offset;
    elementLength: number;
}

type Offset = {
    offsetX: number;
    offsetY: number;
}

var currentDragging: Dragging | null = null;

export function clearCurrentDragging() {
    currentDragging = null;
}

export default function setCurrentDragging(flavor: Flavor, offsetImage: Offset, elementLength: number) {
    currentDragging = {
        flavor,
        elementLength,
        offsetImage
    };
}

export function getCurrentDragging(): Dragging | null {
    return currentDragging;
}