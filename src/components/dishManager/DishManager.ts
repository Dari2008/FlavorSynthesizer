import type { AddDishResponse, DishLoadResponse } from "../../@types/Api";
import type { MainFlavor } from "../../@types/Flavors";
import type { Dish, LocalDish, ServerDish, ServerFlavorElement, ServerFlavorSynthLine, User, UUID } from "../../@types/User";
import { Network } from "../../utils/Network";
import { BASE_URL, URL_EXTENSION } from "../../utils/Statics";
import Utils from "../../utils/Utils";
import type { CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";
import { createElementForFlavor } from "../FlavorUtils";

export default class DishManager {

    public static async loadDishesFromServer(user: User, integDishes: (LocalDish[]) | undefined = undefined, customFlavors: CustomFlavor[]): Promise<Dish[] | false> {
        const jwt = user.jwt;
        const response = await Network.loadJson<DishLoadResponse>(BASE_URL + "/dishes/loadDishes" + URL_EXTENSION, {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt,
                integDishes: integDishes ? (integDishes.map(DishManager.convertDishToServerDish)) : integDishes
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to load dishes from server!");
            return false;
        }

        const dishes = response.dishes.map(e => DishManager.convertServerDishToDish(e, customFlavors));
        console.log(dishes, customFlavors);
        return dishes;
    }

    public static async deleteDish(user: User, uuid: string): Promise<boolean> {
        const jwt = user.jwt;
        const response = await Network.loadJson<undefined>(BASE_URL + "/dishes/update/delete" + URL_EXTENSION, {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt,
                uuid
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to delte the dish");
            return false;
        }
        return true;
    }

    public static async updateEntireDish(user: User, dish: Dish): Promise<boolean> {
        const jwt = user.jwt;
        const response = await Network.loadJson<undefined>(BASE_URL + "/dishes/update/updateDish" + URL_EXTENSION, {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt,
                ...this.convertDishToServerDish(dish)
            })
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return false;
        }
        return true;
    }

    public static async addDish(user: User, dish: Dish | LocalDish): Promise<UUID | boolean> {
        const jwt = user.jwt;
        const response = await Network.loadJson<AddDishResponse>(BASE_URL + "/dishes/update/addDish" + URL_EXTENSION, {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt,
                ...this.convertDishToServerDish(dish)
            })
        });

        if (response.status == "error") {
            Utils.error(response.message);
            return false;
        }

        const changedUUids = response.changedUUIDs;
        if (Object.keys(changedUUids).length == 0) return true;

        return changedUUids[dish.uuid] as UUID;
    }

    public static convertServerDishToDish(dish: ServerDish, customFlavors: CustomFlavor[]): Dish {
        return {
            ...dish as any,
            data: dish.tracks.map(e => {
                return {
                    uuid: Utils.uuidv4(),
                    muted: e.muted,
                    solo: e.solo,
                    volume: e.volume,
                    elements: e.elements.map(e => {
                        return createElementForFlavor(e.flavor, e.from, e.to);
                    })
                }
            }),
            customFlavors: (dish.customFlavors || []).map(e => customFlavors.find(s => s.uuid == e)).filter(e => !!e),
            temporary: undefined
        } as Dish;
    }

    public static convertDishToServerDish(dish: Dish | LocalDish): ServerDish {

        const customFlavors: UUID[] = [];

        for (const flavor of dish.customFlavors) {
            if (customFlavors.includes(flavor.uuid)) continue;
            customFlavors.push(flavor.uuid);
        }

        return {
            tracks: dish.data.map(e => ({
                elements: e.elements.map(el => ({
                    flavor: el.flavor,
                    from: el.from,
                    to: el.to
                } as ServerFlavorElement)),
                muted: e.muted,
                solo: e.solo,
                volume: e.volume
            } as ServerFlavorSynthLine)),
            uuid: dish.uuid,
            mainFlavor: dish.mainFlavor,
            name: dish.name,
            volumes: dish.volumes,
            customFlavors: customFlavors
        } as ServerDish;
    }
}

export type UpdateName = {
    updateType: "updateName";
    name: string;
}

export type UpdateData = {
    updateType: "updateData";
    data: ServerFlavorSynthLine[];
}

export type UpdateMainFlavor = {
    updateType: "updateMainFlavor";
    mainFlavor: MainFlavor;
}