import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
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