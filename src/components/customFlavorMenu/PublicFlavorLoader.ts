import type { CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";
import CustomFlavorServerManager from "./CustomFlavorServerManager";

export default class PublicFlavorLoader {

    private static flavorsLoaded: CustomFlavor[] = [];

    public static async loadPublicFlavors(page: number = 0) {
        const flavors = await CustomFlavorServerManager.getAllPublicFlavors(page);

        const uuids = PublicFlavorLoader.flavorsLoaded.map(e => e.uuid);

        for (const flavor of flavors) {
            if (uuids.includes(flavor.uuid)) continue;
            uuids.push(flavor.uuid);
            PublicFlavorLoader.flavorsLoaded.push(flavor);
        }

        return flavors;
    }

    public static getAllLoadedFlavors() {
        return PublicFlavorLoader.flavorsLoaded;
    }

}