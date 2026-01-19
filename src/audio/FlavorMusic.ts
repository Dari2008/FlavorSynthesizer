import { Player, } from "tone";
import * as Tone from "tone";

const ROOT_FILE_DIR = "./flavors/out/"

export default abstract class FlavorMusic {
    public FLAVOR_NAME: string = "";
    public abstract play(): void;
    public abstract stop(): void;
    public abstract reset(): void;
}

export class FlavorFileMusic {
    private index: number;
    private files: {
        [key in BPM]: Player;
    };
    public NAME: string;
    public imageSrc: string;
    constructor(index: number, name: string) {
        this.index = index;
        this.NAME = name;

        this.files = {} as any;

        this.imageSrc = "./flavors/images/" + encodeURIComponent(name) + "png";

        for (const bpm of BPM) {
            const player = new Player(ROOT_FILE_DIR + bpm + "BPM/" + index + ".wav");
            player.autostart = false;
            this.files[bpm as BPM] = player;
        }
    }

    public play(bpm: BPM) {
        Tone.Transport.stop();
        Tone.Transport.bpm.value = bpm;
        this.stopAll();

        Tone.Transport.start();
        this.files[bpm].toDestination();
        this.files[bpm].start()

    }

    public stopAll() {
        for (const file of Object.values(this.files)) {
            file.stop()
            file.onstop = () => 0;
        }
    }

}

type BPM = 81 |
    110 |
    124 |
    130;

const BPM = [
    81,
    110,
    124,
    130
]