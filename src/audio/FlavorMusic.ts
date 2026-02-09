import { Player, } from "tone";
import * as Tone from "tone";
import { FLAVOR_IMAGES, MAIN_FLAVOR_IMAGES, type Flavor, type MainFlavor } from "../@types/Flavors";
import { getResourceByName, hasResource, loadAndSaveResource, saveResourceWithName } from "../components/ResourceSaver";
import type { DishVolumes } from "../@types/User";

const ROOT_FILE_DIR = "./flavors/audio/"

const FADE_TIME = 0.1;

var FILES_CACHE: {
    [key: string]: {
        [key in BPM]: Promise<string>;
    };
} = {};

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
    private files: {
        [key in BPM]: Player;
    };
    public NAME: Flavor;
    public imageSrc: string;

    private loadedAllPromise: Promise<Player[]> | null = null;
    private promises: Promise<Player>[] = [];

    constructor(index: number | string, name: Flavor, load: boolean = false) {
        this.index = index;
        this.NAME = name;

        this.files = {} as any;
        this.imageSrc = FLAVOR_IMAGES[name];

        if (load) {
            this.download();
        }
    }

    public async downloadSingle(bpm: BPM): Promise<void> {
        if (!FILES_CACHE[this.NAME]) FILES_CACHE[this.NAME] = {} as any;
        if (FILES_CACHE[this.NAME][bpm] !== undefined) return;

        // Only create a new promise if it doesn't exist yet
        if (!FILES_CACHE[this.NAME][bpm as BPM]) {
            const file = ROOT_FILE_DIR + "out/" + bpm + "BPM/" + this.index + ".wav";
            const dbPath = "bpm_" + bpm + "_index_" + this.index;
            FILES_CACHE[this.NAME][bpm as BPM] = loadAndSaveResource("audio", dbPath, file);
        }

        const base64 = await FILES_CACHE[this.NAME][bpm as BPM];
        this.files[bpm as BPM] = new Player();
        this.promises.push(new Promise<any>((res) => {
            const data = atob(base64.replace("data:audio/wav;base64,", ""));
            this.files[bpm as BPM].buffer.fromArray(Float32Array.from(data.split("").map(e => e), parseInt));
            res(this.files[bpm as BPM]);
        }));
        this.files[bpm as BPM].fadeIn = FADE_TIME;
        this.files[bpm as BPM].fadeOut = FADE_TIME;
        this.files[bpm as BPM].autostart = false;
        this.files[bpm as BPM].toDestination();
        this.loadedAllPromise = Promise.all(this.promises);
    }

    public async download() {
        let all = [];
        for (const bpm of BPM_VALS as BPM[]) {
            all.push(this.downloadSingle(bpm));
        }
        await Promise.all(all);
    }

    public play(bpm: BPM) {
        Tone.Transport.stop();
        Tone.Transport.bpm.value = bpm;
        this.stopAllBpms();

        Tone.Transport.start();
        // this.files[bpm].toDestination();
        this.files[bpm].start()
        MUSIC_PLAYERS.push(this.files[bpm]);

    }

    public async clone(loop: boolean = false): Promise<FlavorFileMusic> {
        const clone = new FlavorFileMusic(this.index, this.NAME, false);
        clone.files = {} as any;

        for (const bpm of BPM_VALS) {
            const base64 = await FILES_CACHE[clone.NAME][bpm as BPM];
            const player = new Player();
            const data = atob(base64.replace("data:audio/wav;base64,", ""));
            this.files[bpm as BPM].buffer.fromArray(Float32Array.from(data.split("").map(e => e), parseInt));
            player.fadeIn = FADE_TIME;
            player.fadeOut = FADE_TIME;
            player.toDestination();
            player.autostart = false;
            player.loop = loop;
            clone.files[bpm as BPM] = player;
        }

        if (clone.loadedAllPromise)
            await clone.loadedAllPromise;

        return clone;
    }

    public playSegment(from: number, to: number, bpm: BPM) {
        this.stopAllBpms();
        Tone.Transport.stop();
        Tone.Transport.bpm.value = bpm;
        Tone.Transport.start();
        this.files[bpm].toDestination();
        this.files[bpm].loop = true;
        this.files[bpm].start(from);
        this.files[bpm].stop(to);
        MUSIC_PLAYERS.push(this.files[bpm]);
    }


    public getPlayers(): Player[] {
        return Object.values(this.files);
    }

    public getPlayer(bpm: BPM): Player {
        return this.files[bpm];
    }

    public stopAllBpms() {
        for (const file of Object.values(this.files)) {
            if (file.state == "started") file.stop();
        }
        MUSIC_PLAYERS = MUSIC_PLAYERS.filter(e => !Object.values(this.files).includes(e));
    }

    public dispose() {
        for (const file of Object.values(this.files)) {
            if (file.state == "started") file.stop();
            if (!file.disposed) file.dispose();
        }
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
    private BPM: number = 81;
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

    public async download(): Promise<void> {
        if (this.player) return;

        const file = ROOT_FILE_DIR + this.index;
        const dbPath = this.index.replace(".wav", "");
        const base64 = await loadAndSaveResource("audio", dbPath, file);
        this.player = new Player();

        const data = atob(base64.replace("data:audio/wav;base64,", ""));
        this.player.buffer.fromArray(Float32Array.from(data.split("").map(e => e), parseInt));

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

    public play(offset: number = 0) {
        Tone.Transport.stop();
        Tone.Transport.bpm.value = this.BPM;
        this.stop();

        const now = Tone.now();

        Tone.Transport.start();
        this.player?.start(now, offset);
    }

    public async clone(loop: boolean = false): Promise<MainFlavorFileMusic> {
        const clone = new MainFlavorFileMusic(this.index, this.NAME, false);

        for (const bpm of BPM_VALS) {
            const base64 = await FILES_CACHE[clone.NAME][bpm as BPM];
            const player = new Player();
            const data = atob(base64.replace("data:audio/wav;base64,", ""));
            player.buffer.fromArray(Float32Array.from(data.split("").map(e => e), parseInt));
            player.fadeIn = FADE_TIME;
            player.fadeOut = FADE_TIME;
            player.toDestination();
            player.autostart = false;
            player.loop = loop;
            clone.player = player;
        }

        return clone;
    }

    public playSegment(from: number, to: number, bpm: BPM) {
        this.stop();
        Tone.Transport.stop();
        Tone.Transport.bpm.value = bpm;
        Tone.Transport.start();
        if (!this.player) return;
        this.player.toDestination();
        this.player.loop = true;
        this.player.start(from);
        this.player.stop(to);
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
        if (this.player.state == "started") this.player.stop();
    }

    public dispose() {
        if (!this.player) return;
        if (this.player.state == "started") this.player.stop();
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


export type BPM = 81 |
    110 |
    124 |
    130;

const BPM_VALS = [
    81,
    110,
    124,
    130
]