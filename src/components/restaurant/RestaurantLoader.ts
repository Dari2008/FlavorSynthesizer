import { type APIResponse, type LoadRestaurantData } from "../../@types/Api";
import type { RestaurantDish } from "../../@types/User";
import { Network } from "../../utils/Network";
import Utils from "../../utils/Utils";

export class RestaurantLoader {

    private static DISH_LIST: RestaurantDish[] = [];

    public static async loadRestaurantData(limit: number = 20): Promise<RestaurantDish[]> {
        const response = await Network.loadJson<APIResponse<LoadRestaurantData>>("", {
            method: "POST",
            body: JSON.stringify({
                limit: limit
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to load restaurant menu");
            return [];
        }

        const uuids = RestaurantLoader.DISH_LIST.map(e => e.uuid);

        for (const dish of response.dishes) {
            if (!uuids.includes(dish.uuid)) {
                RestaurantLoader.DISH_LIST.push(dish);
                uuids.push(dish.uuid);
            }
        }

        return response.dishes;
    }

    public static getDishes() {
        return this.DISH_LIST;
    }
}