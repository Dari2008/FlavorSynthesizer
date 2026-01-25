import { Player, } from "tone";
import * as Tone from "tone";
import { FLAVOR_IMAGES, type Flavor, type MainFlavor } from "../@types/Flavors";
import { getResourceByName, hasResource, loadAndSaveResource, saveResourceWithName } from "../components/ResourceSaver";

const ROOT_FILE_DIR = "./flavors/audio/out/"

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
    private index: number;
    private files: {
        [key in BPM]: Player;
    };
    public NAME: Flavor;
    public imageSrc: string;

    private loadedAllPromise: Promise<Player[]> | null = null;
    private promises: Promise<Player>[] = [];

    constructor(index: number, name: Flavor, load: boolean = true) {
        this.index = index;
        this.NAME = name;

        this.files = {} as any;
        this.imageSrc = FLAVOR_IMAGES[name];

        if (load) {
            for (const bpm of BPM_VALS) {
                if (!FILES_CACHE[name]) FILES_CACHE[name] = {} as any;

                // Only create a new promise if it doesn't exist yet
                if (!FILES_CACHE[name][bpm as BPM]) {
                    FILES_CACHE[name][bpm as BPM] = (async () => {
                        const file = ROOT_FILE_DIR + bpm + "BPM/" + index + ".wav";
                        const dbPath = "bpm_" + bpm + "_index_" + index;
                        return loadAndSaveResource("audio", dbPath, file);
                        // if (await hasResource("audio", dbPath)) {
                        //     const base64 = getResourceByName("audio", dbPath);
                        //     return base64;
                        // } else {
                        //     const response = await fetch(file);
                        //     const blob = await response.blob();

                        //     const base64 = await new Promise<string>((resolve, reject) => {
                        //         const reader = new FileReader();
                        //         reader.onloadend = () => resolve(reader.result as string);
                        //         reader.onerror = reject;
                        //         reader.readAsDataURL(blob);
                        //     });
                        //     saveResourceWithName("audio", dbPath, base64);
                        //     return base64;
                        // }

                    })();
                }

                // Await the cache and create the player
                FILES_CACHE[name][bpm as BPM].then((base64) => {
                    this.files[bpm as BPM] = new Player();
                    this.promises.push(this.files[bpm as BPM].load(base64));
                    this.files[bpm as BPM].fadeIn = FADE_TIME;
                    this.files[bpm as BPM].fadeOut = FADE_TIME;
                    this.files[bpm as BPM].autostart = false;
                    this.files[bpm as BPM].toDestination();
                    this.loadedAllPromise = Promise.all(this.promises);
                });
            }
        }
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
        console.log("Cloning");
        const clone = new FlavorFileMusic(this.index, this.NAME, false);
        clone.files = {} as any;

        for (const bpm of BPM_VALS) {
            const base64 = await FILES_CACHE[clone.NAME][bpm as BPM];
            const player = new Player();
            await player.load(base64);
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

type BPM = 81 |
    110 |
    124 |
    130;

const BPM_VALS = [
    81,
    110,
    124,
    130
]