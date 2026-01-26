import { createContext, useContext } from "react";

export type Volumes = {
    master: number;
    mainFlavor: number;
    flavors: number;
}

export const VolumeContext = createContext<Volumes | null>(null);


export default function useVolumes(): Volumes {
    const ctx = useContext<Volumes | null>(VolumeContext);
    if (!ctx) {
        throw ("useVolumes cant bed used outside of VolumeContext");
    }
    return ctx;
}