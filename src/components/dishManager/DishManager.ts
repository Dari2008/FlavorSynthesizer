import type { APIResponse, DishLoadResponse } from "../../@types/Api";
import type { Dish, User } from "../../@types/User";
import { BASE_URL } from "../../utils/Statics";
import Utils from "../../utils/Utils";
import { createElementForFlavor } from "../FlavorUtils";

export default class DishManager {

    public static async loadDishesFromServer(user: User, integDishes: (Dish[]) | undefined = undefined) {
        const jwt = user.jwt;

        const response = await (await fetch(BASE_URL + "/dishes/loadDishes.php", {
            method: "POST",
            body: JSON.stringify({
                jwt,
                integDishes
            })
        })).json() as APIResponse<DishLoadResponse>;

        if (response.status == "error") {
            Utils.error("Failed to load dishes from server!");
            return;
        }

        const dishes = response.dishes.map(dish => {
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
        });
        return dishes;
    }

}