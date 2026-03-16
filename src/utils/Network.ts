import JSZip from "jszip";
import type { APIResponse } from "../@types/Api";
import Utils from "./Utils";

export class Network {

    private static ERROR: Error = {
        status: "error",
        message: "Check again later"
    };

    public static async loadJson<T, E extends object = {}>(url: RequestInfo | URL, props: RequestInit): Promise<APIResponse<T, E>> {
        try {
            const request = await fetch(url, props);
            const s = await request.json() as APIResponse<T, E>;
            if ((s as any).logout) {
                localStorage.removeItem("user");
                Utils.error("Credentials expired");
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
            return s;
        } catch (ex) {
            return Network.ERROR;
        }
    }

    public static async loadZip(url: RequestInfo | URL, props: RequestInit, onProgress: (progress: number, total: number) => void, onFileLoaded: (relativePath: string, file: JSZip.JSZipObject) => void): Promise<null | true> {

        const response = await fetch(url, props);
        if (!response.body) return null;
        const reader = response.body.getReader();

        const contentLength = parseInt(response.headers.get('Content-Length') ?? "-1");
        let receivedLength = 0;
        let chunks = [];

        if (contentLength == -1) return null;

        console.log(contentLength);

        let isDone = false;
        while (!isDone) {
            const { done, value } = await reader.read();
            isDone = done;
            if (!value) break;

            chunks.push(value);
            receivedLength += value.length;
            onProgress(receivedLength, contentLength);
        }

        let chunksAll = new Uint8Array(receivedLength); let position = 0;
        for (let chunk of chunks) {
            chunksAll.set(chunk, position); // (4.2)
            position += chunk.length;
        }

        const zipFile = await JSZip.loadAsync(chunksAll);
        zipFile.forEach((relativePath, file) => {
            onFileLoaded(relativePath, file);
        });
        return true;
    }

}

type Error = {
    status: "error";
    message: string;
};