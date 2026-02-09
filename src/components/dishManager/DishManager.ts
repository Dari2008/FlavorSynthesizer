import type { AddDishResponse, APIResponse, DishLoadResponse } from "../../@types/Api";
import type { MainFlavor } from "../../@types/Flavors";
import type { Dish, LocalDish, ServerDish, ServerFlavorElement, ServerFlavorSynthLine, User } from "../../@types/User";
import { BASE_URL } from "../../utils/Statics";
import Utils from "../../utils/Utils";
import { createElementForFlavor } from "../FlavorUtils";

export default class DishManager {

    public static async loadDishesFromServer(user: User, integDishes: (LocalDish[]) | undefined = undefined): Promise<Dish[] | false> {
        const jwt = user.jwt;
        const response = await (await fetch(BASE_URL + "/dishes/loadDishes.php", {
            method: "POST",
            body: JSON.stringify({
                jwt,
                integDishes: integDishes ? (integDishes.map(DishManager.convertDishToServerDish)) : integDishes
            })
        })).json() as APIResponse<DishLoadResponse>;

        if (response.status == "error") {
            Utils.error("Failed to load dishes from server!");
            return false;
        }

        const dishes = response.dishes.map(DishManager.convertServerDishToDish);
        return dishes;
    }

    public static async deleteDish(user: User, uuid: string): Promise<boolean> {
        const jwt = user.jwt;
        const response = await (await fetch(BASE_URL + "/dishes/update/delete.php", {
            method: "POST",
            body: JSON.stringify({
                jwt,
                uuid
            })
        })).json() as APIResponse<undefined>;

        if (response.status == "error") {
            Utils.error("Failed to delte the dish");
            return false;
        }
        return true;
    }

    public static async updateDish(user: User, updateData: UpdateName | UpdateData | UpdateMainFlavor): Promise<boolean> {
        const jwt = user.jwt;
        const response = await (await fetch(BASE_URL + "/dishes/update/updateDish.php", {
            method: "POST",
            body: JSON.stringify({
                jwt,
                ...updateData
            })
        })).json() as APIResponse<undefined>;
        if (response.status == "error") {
            Utils.error(response.message);
            return false;
        }
        return true;
    }

    public static async updateEntireDish(user: User, dish: Dish): Promise<boolean> {
        const jwt = user.jwt;
        const response = await (await fetch(BASE_URL + "/dishes/update/replaceEntireDish.php", {
            method: "POST",
            body: JSON.stringify({
                jwt,
                ...this.convertDishToServerDish(dish)
            })
        })).json() as APIResponse<undefined>;
        if (response.status == "error") {
            Utils.error(response.message);
            return false;
        }
        return true;
    }

    public static async addDish(user: User, dish: Dish | LocalDish): Promise<string | boolean> {
        const jwt = user.jwt;
        const response = await (await fetch(BASE_URL + "/dishes/update/addDish.php", {
            method: "POST",
            body: JSON.stringify({
                jwt,
                ...this.convertDishToServerDish(dish)
            })
        })).json() as APIResponse<AddDishResponse>;

        if (response.status == "error") {
            Utils.error(response.message);
            return false;
        }

        const changedUUids = response.changedUUIDs;
        if (Object.keys(changedUUids).length == 0) return true;

        return changedUUids[dish.uuid];
    }

    public static convertServerDishToDish(dish: ServerDish): Dish {
        return {
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
            ...dish,
            temporary: undefined
        } as Dish;
    }

    public static convertDishToServerDish(dish: Dish | LocalDish): ServerDish {
        return {
            tracks: dish.data.map(e => ({
                elements: e.elements.map(el => ({
                    flavor: el.flavor.name,
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
            volumes: dish.volumes
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