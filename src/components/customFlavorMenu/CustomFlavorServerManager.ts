import type { User, UUID } from "../../@types/User";
import { Network } from "../../utils/Network";
import { BASE_URL, URL_EXTENSION } from "../../utils/Statics";
import Utils from "../../utils/Utils";
import type { CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";
import { deleteAllResources } from "../ResourceSaver";

export default class CustomFlavorServerManager {
    public static async addCustomFlavor(user: User, customFlavor: CustomFlavor) {
        const response = await Network.loadJson<{}>(BASE_URL + "/customFlavors/add" + URL_EXTENSION, {
            method: "post",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                ...customFlavor,
                jwt: user.jwt
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to add custom flavor");
            return false;
        }
        return response.status == "success";
    }

    public static async removeCustomFlavor(user: User, uuid: UUID) {
        const response = await Network.loadJson<{}>(BASE_URL + "/customFlavors/delete" + URL_EXTENSION, {
            method: "post",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt: user.jwt,
                uuid
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to remove custom flavors");
            return false;
        }
        return response.status == "success";
    }

    public static async updateCustomFlavor(user: User, customFlavor: CustomFlavor) {
        const response = await Network.loadJson<{}>(BASE_URL + "/customFlavors/update" + URL_EXTENSION, {
            method: "post",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                ...customFlavor,
                jwt: user.jwt,
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to update custom flavors");
            return false;
        }
        return response.status == "success";
    }

    public static async getAllCustomFlavors(user: User, localFlavors: CustomFlavor[]) {
        const response = await Network.loadJson<{ customFlavors: CustomFlavor[] }>(BASE_URL + "/customFlavors/getAll" + URL_EXTENSION, {
            method: "post",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt: user.jwt,
                localFlavors
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to get all custom flavors");
            return [];
        }

        deleteAllResources("customFlavors");

        return response.customFlavors;
    }

    public static async updateVisibility(user: User, uuid: UUID, is: boolean) {
        const response = await Network.loadJson<{}>(BASE_URL + "/customFlavors/updateVisibility" + URL_EXTENSION, {
            method: "post",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt: user.jwt,
                uuid,
                is
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to update visibility");
            return [];
        }
        return response.status == "success";
    }

    public static async getAllPublicFlavors(page: number = 0) {
        const response = await Network.loadJson<{ customFlavors: CustomFlavor[] }>(BASE_URL + "/customFlavors/getPublicFlavors" + URL_EXTENSION, {
            method: "post",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                page,
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to get all public custom flavors");
            return [];
        }
        return response.customFlavors;
    }

}
