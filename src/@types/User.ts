import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
import type { FlavorElement } from "../components/flavorSynth/PlayerTrack";
import type { Digit } from "./Api";
import type { Flavor, MainFlavor } from "./Flavors";

export type User = {
    uuid: string;
    jwt: string;
    displayName: string;
}

export type Dish = {
    data: FlavorSynthLine[];
    name: string;
    mainFlavor: MainFlavor;
    volumes: DishVolumes;
    aiImage: string;
    publishState: "published" | "private";
    dishCreationDate: number;
    createdBy: string;
    uuid: string;
    share: {
        code: [Digit, Digit, Digit, Digit, Digit, Digit],
        flavors: [Flavor, Flavor, Flavor, Flavor, Flavor, Flavor];
    } | undefined;
    temporary: true | undefined;
}

export type DishVolumes = {
    master: number;
    mainFlavor: number;
    flavors: number;
};

export type LocalDish = Omit<Dish, "share" | "publishState" | "aiImage" | "temporary" | "dishCreationDate" | "createdBy">;

export type ServerDish = Omit<Dish, "data"> & {
    tracks: ServerFlavorSynthLine[];
}

export type ServerFlavorSynthLine = Omit<FlavorSynthLine, "elements" | "uuid"> & {
    elements: ServerFlavorElement[];
};

export type ServerFlavorElement = Omit<FlavorElement, "flavor" | "uuid"> & {
    flavor: Flavor;
}