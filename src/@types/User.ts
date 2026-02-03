import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";

export type User = {
    uuid: string;
    jwt: string;
    displayName: string;
}

export type Dish = {
    data: FlavorSynthLine;
    name: string;
    publishState: "published" | "private";
}