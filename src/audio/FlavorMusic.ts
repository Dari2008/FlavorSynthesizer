import { Player, } from "tone";
import * as Tone from "tone";
import { FLAVOR_COLOR, FLAVOR_IMAGES, MAIN_FLAVOR_IMAGES, type Flavor, type MainFlavor } from "../@types/Flavors";
import { getResourceByName } from "../components/ResourceSaver";
import type { DishVolumes } from "../@types/User";

// const ROOT_FILE_DIR = "./flavors/audio/"

const FADE_TIME = 0.1;

var FILES_CACHE: {
    [key: string]: Promise<string>;
} = (window as any).FILES_CACHE ?? {};
(window as any).FILES_CACHE = FILES_CACHE;

export default abstract class FlavorMusic {
    public FLAVOR_NAME: MainFlavor | undefined;
    public IMAGE: string | undefined;
    public abstract play(): void;
    public abstract stop(): void;
    public abstract reset(): void;
}

var MUSIC_PLAYERS: Player[] = [];

export class FlavorFileMusic {
    public index: number | string;
    private file: Player;
    public NAME: Flavor;
    public imageSrc: string;
    public colors: string[];

    private loadedAllPromise: Promise<Player[]> | null = null;
    private promises: Promise<Player>[] = [];

    constructor(index: number | string, name: Flavor, load: boolean = false) {
        this.index = index;
        this.NAME = name;
        this.colors = FLAVOR_COLOR[name];

        this.file = {} as any;
        this.imageSrc = FLAVOR_IMAGES[name];

        if (load) {
            this.download();
        }
    }

    public connect(recorder: Tone.Recorder) {
        this.file.connect(recorder);
    }

    public async download(): Promise<void> {
        if (FILES_CACHE[this.NAME] !== undefined) return;

        if (!FILES_CACHE[this.NAME]) {
            // const file = ROOT_FILE_DIR + "new110BPM/out/" + this.index + ".wav";
            const dbPath = this.index + ".wav";
            FILES_CACHE[this.NAME] = getResourceByName("flavors", dbPath);
        }

        const base64 = await FILES_CACHE[this.NAME];
        this.file = new Player();
        this.promises.push(new Promise<any>(async (res) => {
            this.file.buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
            await new Promise<void>(res => (this.file && (this.file.buffer.onload = () => res()) && (this.file.buffer.loaded && res())));
            res(this.file);
        }));
        this.file.fadeIn = FADE_TIME;
        this.file.fadeOut = FADE_TIME;
        this.file.autostart = false;
        this.file.toDestination();
        this.loadedAllPromise = Promise.all(this.promises);

    }


    public play() {
        this.stopAllBpms();
        this.file.unsync().start(Tone.now());
        MUSIC_PLAYERS.push(this.file);

    }

    public async clone(loop: boolean = false): Promise<FlavorFileMusic> {
        const clone = new FlavorFileMusic(this.index, this.NAME, false);
        clone.file = {} as any;

        const base64 = await FILES_CACHE[clone.NAME];
        const player = new Player();
        player.buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
        await new Promise<void>(res => (player && (player.buffer.onload = () => res()) && (player.buffer.loaded && res())));
        player.fadeIn = FADE_TIME;
        player.fadeOut = FADE_TIME;
        player.toDestination();
        player.autostart = false;
        player.loop = loop;
        clone.file = player;

        if (clone.loadedAllPromise)
            await clone.loadedAllPromise;

        return clone;
    }

    public async playSegment(start: number, offset: number, duration: number) {
        this.stopAllBpms();
        if (this.loadedAllPromise)
            await this.loadedAllPromise;

        // const base64 = await FILES_CACHE[this.NAME][bpm as BPM];
        // this.files[bpm].buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
        this.file.loop = true;
        this.file.toDestination();
        this.file.sync().start(Math.max(start, Tone.getTransport().seconds + .01), offset).stop(start + duration);
        MUSIC_PLAYERS.push(this.file);
    }


    public getPlayer(): Player {
        return this.file;
    }

    public stopAllBpms() {
        if (this.file.state == "started") this.file.stop();
    }

    public dispose() {
        if (this.file.state == "started") this.file.stop();
        if (!this.file.disposed) this.file.dispose();
    }

    public static stopAll() {
        MUSIC_PLAYERS.forEach(e => e.stop());
    }

}


export class CustomFlavorMusic {
    public audio: string;
    private file: Player;
    public NAME: Flavor;
    public imageSrc: string;
    public colors: string[];

    private loadedAllPromise: Promise<Player[]> | null = null;
    private promise: Promise<Player> | undefined;


    constructor(audio: string, name: Flavor, colors: string[], imageSrc: string) {
        this.audio = audio;
        this.NAME = name;
        this.colors = colors;

        this.file = {} as any;
        this.imageSrc = imageSrc;
        this.download();
    }

    public connect(recorder: Tone.Recorder) {
        this.file.connect(recorder);
    }

    public async downloadSingle(): Promise<void> {
        if (!FILES_CACHE[this.NAME]) FILES_CACHE[this.NAME] = {} as any;

        const base64 = this.audio;
        this.file = new Player();
        this.promise = new Promise<Player>(async (res) => {
            this.file.buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
            await new Promise<void>(res => (this.file && (this.file.buffer.onload = () => res()) && (this.file.buffer.loaded && res())));
            res(this.file);
        })

        this.file.fadeIn = FADE_TIME;
        this.file.fadeOut = FADE_TIME;
        this.file.autostart = false;
        this.file.toDestination();
        this.loadedAllPromise = Promise.all([this.promise]);
    }

    public async download() {
        return await this.downloadSingle();
    }

    public play() {
        // Tone.Transport.stop();
        // Tone.Transport.bpm.value = bpm;
        this.stopAllBpms();

        // Tone.Transport.start();
        // this.files[bpm].toDestination();
        this.file.unsync().start(Tone.now());
        MUSIC_PLAYERS.push(this.file);

    }

    public async clone(loop: boolean = false): Promise<CustomFlavorMusic> {
        const clone = new CustomFlavorMusic(this.audio, this.NAME, this.colors, this.imageSrc);

        const base64 = this.audio;
        const player = new Player();
        player.buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
        await new Promise<void>(res => (player && (player.buffer.onload = () => res()) && (player.buffer.loaded && res())));
        player.fadeIn = FADE_TIME;
        player.fadeOut = FADE_TIME;
        player.toDestination();
        player.autostart = false;
        player.loop = loop;
        clone.file = player;

        if (clone.loadedAllPromise)
            await clone.loadedAllPromise;

        return clone;
    }

    public async playSegment(start: number, offset: number, duration: number) {
        this.stopAllBpms();
        if (this.loadedAllPromise)
            await this.loadedAllPromise;

        // const base64 = await FILES_CACHE[this.NAME][bpm as BPM];
        // this.files[bpm].buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
        this.file.loop = true;
        this.file.toDestination();
        this.file.sync().start(Math.max(start, Tone.getTransport().seconds + .01), offset).stop(start + duration);
        MUSIC_PLAYERS.push(this.file);
    }


    public getPlayers(): Player[] {
        return Object.values(this.file);
    }

    public getPlayer(): Player {
        return this.file;
    }

    public stopAllBpms() {
        if (this.file.state == "started") this.file.stop();
    }

    public dispose() {
        if (this.file.state == "started") this.file.stop();
        if (!this.file.disposed) this.file.dispose();
    }

    public static stopAll() {
        MUSIC_PLAYERS.forEach(e => e.stop());
    }

}


export class MainFlavorFileMusic {
    private index: string;
    private player: undefined | Player;
    public NAME: MainFlavor;
    public imageSrc: string;
    private volumes: DishVolumes = {
        flavors: 100,
        mainFlavor: 100,
        master: 100
    };

    constructor(index: string, name: MainFlavor, load: boolean = false) {
        this.index = index;
        this.NAME = name;

        this.imageSrc = MAIN_FLAVOR_IMAGES[name];

        if (load) {
            this.download();
        }
    }

    public connect(recorder: Tone.Recorder) {
        this.player?.connect(recorder);
    }

    public async download(): Promise<void> {
        if (this.player) return;

        // const file = ROOT_FILE_DIR + this.index;
        const dbPath = this.index;
        const base64 = await getResourceByName("mainFlavors", dbPath);
        this.player = new Player();
        this.player.buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
        await new Promise<void>(res => (this.player && (this.player.buffer.onload = () => res()) && (this.player.buffer.loaded && res())));

        this.player.fadeIn = FADE_TIME;
        this.player.fadeOut = FADE_TIME;
        this.player.autostart = false;
        this.player.loop = true;
        this.player.toDestination();
    }

    public setVolumes(volumes: DishVolumes) {
        this.volumes = volumes;
        if (this.player) this.player.volume.value = this.getVolumeFor("mainFlavor");
    }

    public async play(start: number, offset: number = 0) {
        if (!this.player) {
            await this.download();
        }
        this.stop();
        const currPos = Tone.getTransport().seconds;
        this.player?.sync().start(Math.max(currPos + start, Tone.getTransport().seconds + .01), offset);
    }

    // public async clone(loop: boolean = false): Promise<MainFlavorFileMusic> {
    //     const clone = new MainFlavorFileMusic(this.index, this.NAME, false);

    //     for (const bpm of BPM_VALS) {
    //         const base64 = await FILES_CACHE[clone.NAME][bpm as BPM];
    //         const player = new Player();
    //         player.buffer = new Tone.ToneAudioBuffer(await base64ToArrayBuffer(base64.split(";base64,")[1]));
    //         await new Promise<void>(res => (player && (player.buffer.onload = () => res()) && (player.buffer.loaded && res())));
    //         player.fadeIn = FADE_TIME;
    //         player.fadeOut = FADE_TIME;
    //         player.toDestination();
    //         player.autostart = false;
    //         player.loop = loop;
    //         clone.player = player;
    //     }

    //     return clone;
    // }

    public playSegment(from: number, to: number) {
        this.stop();
        // Tone.Transport.stop();
        // Tone.Transport.bpm.value = bpm;
        // Tone.Transport.start();
        if (!this.player) return;
        this.player.toDestination();
        this.player.loop = true;
        this.player.sync().start(from).stop(to);
    }


    public getPlayers(): Player[] {
        if (!this.player) return [];
        return [this.player];
    }

    public getPlayer(): Player | undefined {
        return this.player;
    }

    public stop() {
        if (!this.player) return;
        if (this.player.state == "started") {
            this.player.unsync().stop();
        }
    }

    public dispose() {
        if (!this.player) return;
        if (this.player.state == "started") this.player.unsync().stop();
        if (!this.player.disposed) this.player.dispose();
    }

    percentToDb(percent: number) {
        if (percent <= 0) return -Infinity;
        return 20 * Math.log10(percent);
    }

    private getVolumeFor(vol: "flavors" | "mainFlavor"): number {
        const percentageMaster = this.volumes.master / 100;
        const percentageFlavors = this.volumes.flavors / 100;
        const percentagMainFlavors = this.volumes.mainFlavor / 100;
        switch (vol) {
            case "flavors":
                return this.percentToDb(percentageFlavors * percentageMaster);
            case "mainFlavor":
                return this.percentToDb(percentagMainFlavors * percentageMaster);
        }
        return 0;
    }

}

async function base64ToArrayBuffer(base64: string) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const buffer = await new AudioContext().decodeAudioData(bytes.buffer)

    return buffer;
}