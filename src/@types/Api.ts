import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
import type { Flavor } from "./Flavors";

export type APIResponse<T, E extends object = {}> = ErrorAPIResponse<E> | SuccessAPIResponse<T>;

export type ErrorAPIResponse<E extends object = {}> = E & {
    status: "error";
    message: string;
}

export type ErrorAPIResponseNoParam = {
    status: "error";
    message: string;
}

export type SuccessAPIResponse<T> = T & {
    status: "success";
    message?: string;
}

export type LoginResponse = {
    jwtData: JWTData;
};

export type RegisterResponse = {
    jwtData: JWTData;
};

export type ShareErrorResponse = {
    flavorComboExists: true;
}

export type ShareResponse = {
    dishData: {
        code: [Digit, Digit, Digit, Digit, Digit, Digit];
        aiImage: string;
    };
};

export type OpenShareResponse = {
    tracks: {
        solo: boolean;
        muted: boolean;
        volume: number;
        elements: {
            from: number;
            to: number;
            flavor: Flavor;
        }[];
    }[];
}


export type FlavorsSelected = {
    flavor: Flavor;
    index: number;
};

export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type JWTData = {
    jwt: string;
    allowedUntil: number;
}