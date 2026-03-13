import type { APIResponse } from "../@types/Api";

export class Network {

    private static ERROR: Error = {
        status: "error",
        message: "Check again later"
    };

    public static async loadJson<T, E extends object = {}>(url: RequestInfo | URL, props: RequestInit): Promise<APIResponse<T, E>> {
        try {
            const request = await fetch(url, props);
            return await request.json() as APIResponse<T, E>;
        } catch (ex) {
            return Network.ERROR;
        }
    }

}

type Error = {
    status: "error";
    message: string;
};