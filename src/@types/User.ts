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
    createdAt: string;
    createdBy: string;
    uuid: UUID;
    share: {
        code: [Digit, Digit, Digit, Digit, Digit, Digit],
        flavors: [Flavor, Flavor, Flavor, Flavor, Flavor, Flavor];
        aiImage: string;
    } | undefined;
    temporary?: true;
}

export type RestaurantDish = Omit<ServerDish, "share"> & {
    share?: {
        aiImage?: string;
    }
    createdBy: string;
    createdAt: string;
};

export type DishVolumes = {
    master: number;
    mainFlavor: number;
    flavors: number;
};

export type LocalDish = Omit<Dish, "type" | "share" | "publishState" | "aiImage" | "temporary" | "createdAt" | "createdBy"> & {
    type: "localDish";
};

export type ServerDish = Omit<Dish, "data" | "createdAt" | "createdBy"> & {
    tracks: ServerFlavorSynthLine[];
}

export type MultiplayerServerDish = Omit<Dish, "data"> & {
    tracks: MultiplayerServerFlavorSynthLine[];
}

export type MultiplayerServerFlavorSynthLine = Omit<FlavorSynthLine, "elements" | "uuid"> & {
    elements: MultiplayerServerFlavorElement[];
};


export type MultiplayerServerFlavorElement = FlavorElement;

export type ServerFlavorSynthLine = Omit<FlavorSynthLine, "elements" | "uuid"> & {
    elements: ServerFlavorElement[];
};

export type ServerFlavorElement = Omit<FlavorElement, "uuid"> & {
    flavor: Flavor;
}

export type UUID = `${string}-${string}-${string}-${string}-${string}`;