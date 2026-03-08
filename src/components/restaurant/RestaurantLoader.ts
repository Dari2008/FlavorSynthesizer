import { type APIResponse, type LoadRestaurantData } from "../../@types/Api";
import type { RestaurantDish } from "../../@types/User";
import { Network } from "../../utils/Network";
import { BASE_URL } from "../../utils/Statics";
import Utils from "../../utils/Utils";

export class RestaurantLoader {

    private static DISH_LIST: RestaurantDish[] = [];

    public static async loadRestaurantData(limit: number = 20): Promise<RestaurantDish[]> {

        // const all: RestaurantDish[] = [
        //     {
        //         createdBy: "Darius",
        //         createdAt: "2026-02-28 21:34:55",
        //         mainFlavor: "Bitter",
        //         name: "Test",
        //         publishState: "public",
        //         type: "dish",
        //         uuid: Utils.uuidv4(),
        //         tracks: [],
        //         temporary: undefined,
        //         volumes: {
        //             flavors: 100,
        //             mainFlavor: 100,
        //             master: 100
        //         }
        //     }
        // ];

        // RestaurantLoader.DISH_LIST.push(...all);

        const response = await Network.loadJson<APIResponse<LoadRestaurantData>>(BASE_URL + "/restaurant/loadMenu.php", {
            method: "POST",
            body: JSON.stringify({
                limit: limit
            })
        });

        if (response.status == "error") {
            Utils.error(response.message ?? "Failed to load restaurant menu");
            return [];
        }

        const uuids = RestaurantLoader.DISH_LIST.map(e => e.uuid);

        for (const dish of response.dishes) {
            if (!uuids.includes(dish.uuid)) {
                RestaurantLoader.DISH_LIST.push(dish);
                uuids.push(dish.uuid);
            }
        }
        return RestaurantLoader.DISH_LIST;
    }

    public static async loadDishesSortedAfter(sortedAfter: "newest" | "oldest" | "flavorCount", limit: number = 20): Promise<RestaurantDish[]> {

        const response = await Network.loadJson<APIResponse<LoadRestaurantData>>(BASE_URL + "/restaurant/loadMenu.php", {
            method: "POST",
            body: JSON.stringify({
                limit: limit,
                sortedAfter: sortedAfter
            })
        });

        if (response.status == "error") {
            Utils.error(response.message ?? "Failed to load restaurant menu");
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