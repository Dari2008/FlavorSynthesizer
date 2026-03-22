import type { APIResponse, ShareDigits, MultiplayerJoinResponse, MultiplayerCreateResponse } from "../@types/Api";
import type { Dish, DishVolumes, MultiplayerCreateServerDish, ServerDish, UUID } from "../@types/User";
import type { CustomFlavor } from "../components/addCustomFlavor/CustomFlavorManager";
import type { FlavorElement } from "../components/flavorSynth/PlayerTrack";
import type { ChatMessage } from "../components/multiplayerChatOverlay/MultiplayerChatOverlay";
import { withTimeoutDebounce } from "../hooks/Debounce";
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

    public close() {
        this.serverCommunication?.close();
        this.serverCommunication = undefined;
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
            Utils.error(response.message ?? "Failed to join meeting");
            return false;
        }

        this.hasJoined = true;
        this.gameUUID = response.gameUUID;
        this.endpointUUID = response.endpointUUID;
        this._isOwner = false;

        await this.joinLiveServer();
        return true;
    }

    public getCode() {
        return this.code;
    }

    public async create(dish: UUID | MultiplayerCreateServerDish, name: string, jwt?: string) {
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

    protected ws: WebSocket | undefined;

    private callbacks: {
        [key: number]: <T>(data: APIResponse<T>) => void;
    } = {};
    private currentReqId: number = 0;
    private gameUUID: UUID;
    private endpointUUID: UUID;
    protected onUnprocessedMessage: ((data: any) => void) | undefined;
    protected isOwner: boolean = false;
    protected onInitialSetting: ((isMuted: boolean, isViewOnly: boolean) => void) | undefined;

    constructor(gameUUID: UUID, endpointUUID: UUID, isOwner: boolean) {
        this.gameUUID = gameUUID;
        this.endpointUUID = endpointUUID;
        this.isOwner = isOwner;
    }

    public close() {
        this.ws?.close();
    }

    public async init() {
        this.ws = new WebSocket(BASE_URL + "/multiplayer/live", "ws");
        this.ws.addEventListener("error", this.onError.bind(this));
        this.ws.addEventListener("message", this.onMessage.bind(this));
        this.ws.addEventListener("close", this._onClose.bind(this));

        // await new Promise<void>((res) => {
        // });

        await new Promise<void>((res) => {
            this.ws?.addEventListener("open", () => res());
        });
        await this.onOpen();
    }

    private async onOpen() {
        const response = await this.send<any, { isMuted: boolean; isViewOnly: boolean; }>({
            type: "initial",
            gameUUID: this.gameUUID,
            endpointUUID: this.endpointUUID
        });

        if (response.status == "error") {
            console.log(response.message, response);
            return;
        }

        this.onInitialSetting?.(response.isMuted, response.isViewOnly)

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

    private _onClose() {
        console.log("Connection lost");
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
    public sendResponse<T>(data: T) {
        this.ws?.send(JSON.stringify(data));
    }


}


export class ServerCommunication extends BasicServerCommunication {
    private static DEBOUNCE_TIME = 500;

    public onPlayerJoin: ((playerCount: number, playerJoined: PlayerJoined) => Promise<PlayJoinScope>) | undefined;
    public onChatMessageReceive: ((message: ChatMessage) => void) | undefined;
    public onReceivedCompleteDish: ((dish: Dish) => void) | undefined;

    public onFlavorAdded = withEventList<((trackUUID: UUID, flavorData: FlavorElement) => void), [UUID, FlavorElement]>();
    public onSynthLineAdded = withEventList<((synthLineUUID: UUID) => void), [UUID]>();
    public onSynthLineRemoved = withEventList<((synthLineUUID: UUID) => void), [UUID]>();
    public onFlavorsRemoved = withEventList<((selectedFlavors: UUID[]) => void), [UUID[]]>();
    public onVolumeChanged = withEventList<((newVolume: number, volumeSlot: keyof DishVolumes) => void), [number, keyof DishVolumes]>();
    public onChangeTrackVolume = withEventList<((newVolume: number, trackUUID: UUID) => void), [number, UUID]>();
    public onFlavorsSelected = withEventList<((endpointUUID: UUID, flavorUUIDs: UUID[]) => void), [UUID, UUID[]]>();
    public onSelectOnly = withEventList<((endpointUUID: UUID, flavorUUID: UUID) => void), [UUID, UUID]>();
    public onFlavorsDeselected = withEventList<((endpointUUID: UUID, flavorUUIDs: UUID[]) => void), [UUID, UUID[]]>();
    public onAllFlavorsDeselected = withEventList<((endpointUUID: UUID) => void), [UUID]>();
    public onUpdatedFlavors = withEventList<((flavors: (FlavorElement & { trackUUID: UUID })[]) => void), [(FlavorElement & { trackUUID: UUID })[]]>();
    public onAddCustomFlavor = withEventList<((customFlavor: CustomFlavor) => void), [CustomFlavor]>();
    public onRename = withEventList<((newName: string) => void), [string]>();
    public onSave = withEventList<(() => void), []>();
    public onMute = withEventList<((is: boolean) => void), [boolean]>();
    public onViewOnly = withEventList<((is: boolean) => void), [boolean]>();
    public onKick = withEventList<(() => void), []>();
    public onPlayerLeft = withEventList<((playerLeft: { name: string, endpointUUID: UUID }) => void), [{ name: string, endpointUUID: UUID }]>();
    public onClose = withEventList<((reason: string) => void), [string]>();

    private onInitalSettingsSet(isMuted: boolean, isViewOnly: boolean) {
        if (isMuted) this.onMute.call(isMuted);
        if (isViewOnly) this.onViewOnly.call(isViewOnly);
    }

    constructor(gameUUID: UUID, endpointUUID: UUID, isOwner: boolean) {
        super(gameUUID, endpointUUID, isOwner);
        this.onUnprocessedMessage = this.processMessage;
        this.onInitialSetting = this.onInitalSettingsSet;
    }

    private async processMessage(data: any) {
        const type = data.type;

        switch (type) {
            case "playerJoined":
                const state = await this.onPlayerJoin?.(data.playerCount, data.joinedPlayer);
                this.sendResponse({
                    type: "playerJoinResponse",
                    playerState: state,
                    player: data.joinedPlayer,
                    reqId: data.reqId
                });
                break;
            case "chatMessage":
                this.onChatMessageReceive?.(data.message);
                break;

            case "dishUpdate":
                this.onReceivedCompleteDish?.(data.dish);
                break;

            case "addFlavor":
                this.onFlavorAdded.call(data.trackUUID, data.flavorData);
                break;
            case "addSynthLine":
                this.onSynthLineAdded.call(data.synthLineUUID);
                break;
            case "removeSynthLine":
                this.onSynthLineRemoved.call(data.synthLineUUID);
                break;
            case "removeFlavors":
                this.onFlavorsRemoved.call(data.selectedFlavors);
                break;
            case "changeVolume":
                this.onVolumeChanged.call(data.newVolume, data.volumeSlot);
                break;
            case "changeTrackVolume":
                this.onChangeTrackVolume.call(data.newVolume, data.trackUUID);
                break;
            case "selectFlavors":
                this.onFlavorsSelected.call(data.endpointUUID, data.flavorUUIDs);
                break;
            case "selectOnly":
                this.onSelectOnly.call(data.endpointUUID, data.flavorUUID);
                break;
            case "deselectFlavors":
                this.onFlavorsDeselected.call(data.endpointUUID, data.flavorUUIDs);
                break;
            case "deselectAllFlavors":
                this.onAllFlavorsDeselected.call(data.endpointUUID);
                break;
            case "updateFlavors":
                this.onUpdatedFlavors.call(data.flavors);
                break;
            case "addCustomFlavor":
                this.onAddCustomFlavor.call(data.newCustomFlavor);
                break;
            case "rename":
                this.onRename.call(data.newName);
                break;
            case "save":
                this.onSave.call();
                break;
            case "close":
                this.onClose.call(data.reason);
                break;
            case "playerLeft":
                console.log(data, data.leftPlayer);
                this.onPlayerLeft.call(data.leftPlayer);
                break;
            case "kick":
                this.onKick.call();
                break;
            case "mute":
                this.onMute.call(data.is);
                break;
            case "viewOnly":
                this.onViewOnly.call(data.is);
                break;

            default:
                console.error("unknown type", type);
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

    public async addCustomFlavor(customFlavor: CustomFlavor) {
        const response = await this.send({
            type: "addCustomFlavor",
            ...customFlavor
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

    public changeMasterVolume = withTimeoutDebounce((newVolume: number) => this._changeVolume(newVolume, "master"), ServerCommunication.DEBOUNCE_TIME);
    public changeFlavorVolume = withTimeoutDebounce((newVolume: number) => this._changeVolume(newVolume, "flavors"), ServerCommunication.DEBOUNCE_TIME);
    public changeMainFlavorVolume = withTimeoutDebounce((newVolume: number) => this._changeVolume(newVolume, "mainFlavor"), ServerCommunication.DEBOUNCE_TIME);

    private async _changeVolume(newVolume: number, volumeSlot: keyof DishVolumes) {
        console.log("changeVolume");
        const response = await this.send({
            type: "changeVolume",
            newVolume,
            volumeSlot
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public changeTrackVolume = withTimeoutDebounce((trackUUID: UUID, newVolume: number) => this._changeTrackVolume(trackUUID, newVolume), ServerCommunication.DEBOUNCE_TIME);
    public async _changeTrackVolume(trackUUID: UUID, newVolume: number) {
        const response = await this.send({
            type: "changeTrackVolume",
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

    public async selectOnly(flavorUUID: UUID) {
        const response = await this.send({
            type: "selectOnly",
            flavorUUID
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

    public rename = withTimeoutDebounce((newName: string) => this._rename(newName), ServerCommunication.DEBOUNCE_TIME);
    public async _rename(newName: string) {
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

    public save = withTimeoutDebounce(() => this._save(), ServerCommunication.DEBOUNCE_TIME);
    public async _save() {
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
        if (!this.isOwner) {
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

    public async mute(playerEndpointUUID: UUID, is: boolean) {
        if (!this.isOwner) {
            return;
        }
        const response = await this.send({
            type: "mute",
            playerEndpointUUID,
            is
        });
        if (response.status == "error") {
            Utils.error(response.message);
            return;
        }
        return true;
    }

    public async viewOnly(playerEndpointUUID: UUID, is: boolean) {
        if (!this.isOwner) {
            return;
        }
        const response = await this.send({
            type: "viewOnly",
            playerEndpointUUID,
            is
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


    // public withDebounce(debounceTime: number = 500) {
    //     console.log("New w debounce");
    //     const _addFlavor = withDebounce((trackUUID: UUID, flavorElement: FlavorElement) => this.addFlavor(trackUUID, flavorElement), debounceTime);
    //     const _addSynthLine = withDebounce((synthLineUUID: UUID) => this.addSynthLine(synthLineUUID), debounceTime);
    //     const _removeSynthLine = withDebounce((synthLineUUID: UUID) => this.removeSynthLine(synthLineUUID), debounceTime);
    //     const _removeFlavors = withDebounce(() => this.removeFlavors(), debounceTime);
    //     const _changeVolume = withDebounce((newVolume: number, volumeSlot: keyof DishVolumes) => this.changeVolume(newVolume, volumeSlot), debounceTime);
    //     const _changeTrackVolume = withDebounce((trackUUID: UUID, newVolume: number) => this.changeTrackVolume(trackUUID, newVolume), debounceTime);
    //     const _selectFlavors = withDebounce((flavorUUIDs: UUID[]) => this.selectFlavors(flavorUUIDs), debounceTime);
    //     const _deselectFlavors = withDebounce((flavorUUIDs: UUID[]) => this.deselectFlavors(flavorUUIDs), debounceTime);
    //     const _deselectAllFlavors = withDebounce(() => this.deselectAllFlavors(), debounceTime);
    //     const _updateFlavors = withDebounce((flavors: MovedFlavor[]) => this.updateFlavors(flavors), debounceTime);
    //     const _rename = withDebounce((newName: string) => this.rename(newName), debounceTime);
    //     const _save = withDebounce(() => this.save(), debounceTime);

    //     return {
    //         addFlavor: _addFlavor,
    //         addSynthLine: _addSynthLine,
    //         removeSynthLine: _removeSynthLine,
    //         removeFlavors: _removeFlavors,
    //         changeVolume: _changeVolume,
    //         changeTrackVolume: _changeTrackVolume,
    //         selectFlavors: _selectFlavors,
    //         deselectFlavors: _deselectFlavors,
    //         deselectAllFlavors: _deselectAllFlavors,
    //         updateFlavors: _updateFlavors,
    //         rename: _rename,
    //         save: _save
    //     };
    // }

}

export type MovedFlavor = {
    uuid: UUID;
    trackUUID: UUID;
    from: number;
    to: number;
}

export type PlayerJoined = {
    name: string;
    endpointUUID: UUID;
    muted: boolean;
    viewOnly: boolean;
};

export type PlayJoinScope = {
    muted: boolean;
    viewOnly: boolean;
    kick: boolean;
}

export type ServerFlavorSelected = {
    flavorUUID: UUID;
    trackUUID: UUID;
}


function withEventList<E extends (...a: T) => void, T extends any[]>() {
    let list: {
        [key: string]: E;
    } = {}
    return {
        call: (...data: T) => {
            Object.values(list).forEach(e => e(...data));
        },
        add: (key: string, f: E) => {
            list[key] = f;
        },
        remove: (key: string) => {
            delete list[key];
        },
    }
}