export class Network {

    private static ERROR: Error = {
        status: "error",
        message: "Check again later"
    };

    public static async loadJson<T>(url: RequestInfo | URL, props: RequestInit): Promise<T | Error> {
        try {

            const request = await fetch(url, props);
            if (!request.ok) return Network.ERROR;
            return await request.json() as T;
        } catch (ex) {
            return Network.ERROR;
        }
    }

}

type Error = {
    status: "error";
    message: string;
};