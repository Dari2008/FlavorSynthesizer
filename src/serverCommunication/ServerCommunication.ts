import type { APIResponse, ShareDigits, MultiplayerJoinResponse, MultiplayerCreateResponse } from "../@types/Api";
import type { DishVolumes, ServerDish, UUID } from "../@types/User";
import type { FlavorElement } from "../components/flavorSynth/PlayerTrack";
import withDebounce from "../hooks/Debounce";
import { Network } from "../utils/Network";
import { BASE_URL } from "../utils/Statics";
import Utils from "../utils/Utils";

export class MultiplayerServer {

    private hasJoined: boolean = false;
    private gameUUID: UUID | undefined = undefined;
    private endpointUUID: UUID | undefined = undefined;
    private serverCommunication: ServerCommunication | undefined = undefined;
    protected _isOwner: boolean = false;
    private code: ShareDigits | undefined;

    public getServerCommunication() {
        if (!this.serverCommunication) throw ("You have to Join a game first");
        return this.serverCommunication;
    }

    public isOwner() {
        return this._isOwner;
    }

    public isJoined() {
        return this.hasJoined;
    }

    private async joinLiveServer() {
        if (!this.hasJoined) {
            Utils.error("You have to join first");
            return;
        }

        if (!this.gameUUID || !this.endpointUUID) {
            Utils.error("Failed to connect to server");
            return;
        }
        this.serverCommunication = new ServerCommunication(this.gameUUID, this.endpointUUID, this._isOwner);
        await this.serverCommunication.init();
    }

    public async join(code: ShareDigits, name: string, jwt?: string) {
        const response = await Network.loadJson<APIResponse<MultiplayerJoinResponse>>(BASE_URL + "/multiplayer/join", {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                code: code,
                jwt,
                name
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to join meeting");
            return false;
        }

        this.hasJoined = true;
        this.gameUUID = response.gameUUID;
        this.endpointUUID = response.endpointUUID;
        this._isOwner = false;

        this.joinLiveServer();
        return true;
    }

    public getCode() {
        return this.code;
    }

    public async create(dish: UUID | ServerDish, name: string, jwt?: string) {
        const response = await Network.loadJson<APIResponse<MultiplayerCreateResponse>>(BASE_URL + "/multiplayer/create", {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt,
                ...(typeof dish == "string" ? { dishUUID: dish } : { dish }),
                name
            })
        });

        if (response.status == "error") {
            Utils.error("Failed to join meeting");
            return false;
        }

        this.hasJoined = true;
        this.gameUUID = response.gameUUID;
        this.endpointUUID = response.endpointUUID;
        this.code = response.code;
        this._isOwner = true;

        await this.joinLiveServer();
        return true;
    }

}

export class BasicServerCommunication {

    private ws: WebSocket | undefined;

    private callbacks: {
        [key: number]: <T>(data: APIResponse<T>) => void;
    } = {};
    private currentReqId: number = 0;
    private gameUUID: UUID;
    private endpointUUID: UUID;
    protected onUnprocessedMessage: ((data: any) => void) | undefined;
    protected onClose: ((ev: CloseEvent) => void) | undefined;
    protected isOwner: boolean = false;

    constructor(gameUUID: UUID, endpointUUID: UUID, isOwner: boolean) {
        this.gameUUID = gameUUID;
        this.endpointUUID = endpointUUID;
        this.isOwner = isOwner;

    }

    public async init() {
        this.ws = new WebSocket(BASE_URL + "/multiplayer/live", "ws");
        this.ws.addEventListener("error", this.onError.bind(this));
        this.ws.addEventListener("message", this.onMessage.bind(this));
        this.ws.addEventListener("close", this._onClose.bind(this));

        await new Promise<void>((res) => {
            const onOpen = async () => {
                await this.onOpen.bind(this)();
                res();
            };
            this.ws?.addEventListener("open", onOpen.bind(this));
        });
    }

    private async onOpen() {
        const response = await this.send({
            type: "initial",
            gameUUID: this.gameUUID,
            endpointUUID: this.endpointUUID
        });

        if (response.status == "error") {
            console.log(response.message, response);
        }
    }

    private onError(ev: Event) {
        console.log(ev);
    }

    private async onMessage(ev: MessageEvent) {
        const data = JSON.parse(ev.data);
        if (data.reqId != null && data.reqId != undefined && data.reqId >= 0) {
            this.callbacks[data.reqId as number]?.(data);
            delete this.callbacks[data.reqId as number];
            return;
        }

        this.onUnprocessedMessage?.(data);
    }

    private _onClose(ev: CloseEvent) {
        this.onClose?.(ev);
    }


    public send<T, E>(data: T): Promise<APIResponse<E>> {
        const reqId = this.currentReqId;
        this.currentReqId++;
        return new Promise<APIResponse<E>>((res) => {
            this.ws?.send(JSON.stringify({
                reqId,
                ...data
            }));

            this.callbacks[reqId] = (data: APIResponse<E>) => {
                res(data);
            };
        });
    }


}

export class ServerCommunication extends BasicServerCommunication {

    public onPlayerJoin: ((playerCount: number, playerJoined: PlayerJoined) => boolean) | undefined;

    constructor(gameUUID: UUID, endpointUUID: UUID, isOwner: boolean) {
        super(gameUUID, endpointUUID, isOwner);
        this.onUnprocessedMessage = this.processMessage;
    }

    private processMessage(data: any) {
        const type = data.type;
        if (type == "newPlayerJoined") {
            const success = this.onPlayerJoin?.(data.playerCount, data.playerJoined);
            if (!success) {
                this.send({
                    type: "kickPlayer",
                    player: data.playerJoined
                });
            }
        }
    }

    public async addFlavor(trackUUID: UUID, flavorElement: FlavorElement) {
        const response = await this.send({
            type: "addFlavor",
            ...flavorElement,
            trackUUID
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async addSynthLine(synthLineUUID: UUID) {
        const response = await this.send({
            type: "addSynthLine",
            synthLineUUID
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async removeSynthLine(synthLineUUID: UUID) {
        const response = await this.send({
            type: "removeSynthLine",
            synthLineUUID
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async removeFlavors() {
        const response = await this.send({
            type: "removeFlavors",
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async changVolume(newVolume: number, volumeSlot: keyof DishVolumes) {
        const response = await this.send({
            type: "changVolume",
            newVolume,
            volumeSlot
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async changTrackVolume(trackUUID: UUID, newVolume: number) {
        const response = await this.send({
            type: "changTrackVolume",
            trackUUID,
            newVolume
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async selectFlavors(flavorUUIDs: UUID[]) {
        const response = await this.send({
            type: "selectFlavors",
            flavorUUIDs
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async deselectFlavors(flavorUUIDs: UUID[]) {
        const response = await this.send({
            type: "deselectFlavors",
            flavorUUIDs
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async deselectAllFlavors() {
        const response = await this.send({
            type: "deselectAllFlavors"
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async updateFlavors(flavors: MovedFlavor[]) {
        const response = await this.send({
            type: "updateFlavors",
            flavors
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async rename(newName: string) {
        const response = await this.send({
            type: "rename",
            newName
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async save() {
        if (this.isOwner) {
            return;
        }
        const response = await this.send({
            type: "save"
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async kick(playerEndpointUUID: UUID) {
        if (this.isOwner) {
            return;
        }
        const response = await this.send({
            type: "kick",
            playerEndpointUUID
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async mute(playerEndpointUUID: UUID) {
        if (this.isOwner) {
            return;
        }
        const response = await this.send({
            type: "mute",
            playerEndpointUUID
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async sendMessage(message: string, time: number, uuid: UUID) {
        const response = await this.send({
            type: "message",
            message,
            time,
            uuid
        });

        if (response.status == "error") {
            Utils.error(response.message);
            return false;
        }
        return true;
    }


    public withDebounce(debounceTime: number = 100) {
        return {
            addFlavor: (trackUUID: UUID, flavorElement: FlavorElement) => {
                withDebounce(() => this.addFlavor(trackUUID, flavorElement), debounceTime);
            },
            addSynthLine: (synthLineUUID: UUID) => {
                withDebounce(() => this.addSynthLine(synthLineUUID), debounceTime);
            },
            removeSynthLine: (synthLineUUID: UUID) => {
                withDebounce(() => this.removeSynthLine(synthLineUUID), debounceTime);
            },
            removeFlavors: () => {
                withDebounce(() => this.removeFlavors(), debounceTime);
            },
            changVolume: (newVolume: number, volumeSlot: keyof DishVolumes) => {
                withDebounce(() => this.changVolume(newVolume, volumeSlot), debounceTime);
            },
            changTrackVolume: (trackUUID: UUID, newVolume: number) => {
                withDebounce(() => this.changTrackVolume(trackUUID, newVolume), debounceTime);
            },
            selectFlavors: (flavorUUIDs: UUID[]) => {
                withDebounce(() => this.selectFlavors(flavorUUIDs), debounceTime);
            },
            deselectFlavors: (flavorUUIDs: UUID[]) => {
                withDebounce(() => this.deselectFlavors(flavorUUIDs), debounceTime);
            },
            deselectAllFlavors: () => {
                withDebounce(() => this.deselectAllFlavors(), debounceTime);
            },
            updateFlavors: (flavors: MovedFlavor[]) => {
                withDebounce(() => this.updateFlavors(flavors), debounceTime);
            },
            rename: (newName: string) => {
                withDebounce(() => this.rename(newName), debounceTime);
            },
            save: () => {
                withDebounce(() => this.save(), debounceTime);
            }
        }
    }

}

type MovedFlavor = {
    uuid: UUID;
    trackUUID: UUID;
    from: number;
    to: number;
}

export type PlayerJoined = {
    name: string;
    endpointUUID: UUID;
};