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
    type: "dish";
    data: FlavorSynthLine[];
    name: string;
    mainFlavor: MainFlavor;
    volumes: DishVolumes;
    publishState: "public" | "private";
    dishCreationDate: number;
    createdBy: string;
    uuid: UUID;
    share: {
        code: [Digit, Digit, Digit, Digit, Digit, Digit],
        flavors: [Flavor, Flavor, Flavor, Flavor, Flavor, Flavor];
        aiImage: string;
    } | undefined;
    temporary: true | undefined;
}

export type RestaurantDish = Omit<ServerDish, "share">;

export type DishVolumes = {
    master: number;
    mainFlavor: number;
    flavors: number;
};

export type LocalDish = Omit<Dish, "type" | "share" | "publishState" | "aiImage" | "temporary" | "dishCreationDate" | "createdBy"> & {
    type: "localDish";
};

export type ServerDish = Omit<Dish, "data"> & {
    tracks: ServerFlavorSynthLine[];
}

export type ServerFlavorSynthLine = Omit<FlavorSynthLine, "elements" | "uuid"> & {
    elements: ServerFlavorElement[];
};

export type ServerFlavorElement = Omit<FlavorElement, "flavor" | "uuid"> & {
    flavor: Flavor;
}

export type UUID = `${string}-${string}-${string}-${string}-${string}`;