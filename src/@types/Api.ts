import type { Flavor } from "./Flavors";
import type { Dish, DishVolumes, RestaurantDish, ServerDish } from "./User";

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
    displayName: string;
    uuid: string;
};

export type RegisterResponse = {
    jwtData: JWTData;
};

export type ShareErrorResponse = {
    flavorComboExists: true;
}

export type ShareResponse = {
    dishData: {
        code: ShareDigits;
        aiImage: string;
    };
};

export type OpenShareResponse = {
    dish: ServerDish;
    aiImage: string;
    uuid: string;
    share: {
        code: ShareDigits,
        flavors: ShareFlavors
    };
    name: string;
    dishCreationDate: number;
    createdBy: string;
    publishState: "private" | "public";
    volumes: DishVolumes;
}

export type DishLoadResponse = {
    dishes: ServerDish[];
}

export type AddDishResponse = {
    changedUUIDs: {
        [key: string]: string;
    };
}

export type FlavorsSelected = {
    flavor: Flavor;
    index: number;
};

export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ShareDigits = [Digit, Digit, Digit, Digit, Digit, Digit];
export type ShareFlavors = [Flavor, Flavor, Flavor, Flavor, Flavor, Flavor];

type JWTData = {
    jwt: string;
    allowedUntil: number;
}

export type VisibilityStateChangeResponse = {

}

export type LoadRestaurantData = {
    dishes: RestaurantDish[];
}
