import * as Tone from "tone";
import FlavorMusic from "../FlavorMusic";
import { MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors";

export default class Spicy extends FlavorMusic {
    public FLAVOR_NAME: MainFlavor = "Spicy";
    public IMAGE: string = MAIN_FLAVOR_IMAGES["Spicy"];

    private lead: Tone.Synth;
    private kick: Tone.MembraneSynth;
    private hat: Tone.MetalSynth;

    private distortion: Tone.Distortion;
    private reverb: Tone.Reverb;

    private leadPart: Tone.Part | null = null;
    private kickPart: Tone.Part | null = null;
    private hatLoop: Tone.Loop | null = null;

    private isPlaying = false;

    constructor() {
        super();

        this.distortion = new Tone.Distortion(0.25);
        this.reverb = new Tone.Reverb({ decay: 3, wet: 0.15 });

        this.lead = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8 }
        }).chain(this.distortion, this.reverb, Tone.Destination);

        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.1,
            octaves: 4,
            envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 }
        }).toDestination();

        this.hat = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.15, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 16,
            resonance: 4000,
            octaves: 1.5
        }).toDestination();

        this.hat.frequency.value = 600;

        this.createLoop();
    }

    private createLoop(): void {
        const loopLength = "2m";

        const melody = ["C5", "D5", "E5", "G5"];
        this.leadPart = new Tone.Part((time, note) => {
            const velocity = 0.2 + Math.random() * 0.15;
            this.lead.triggerAttackRelease(note as string, "8n", time, velocity);
        }, melody.map((n, i) => [Tone.Time(`${i * 2}n`).toNotation(), n]));

        this.leadPart.loop = true;
        this.leadPart.loopEnd = loopLength;

        this.kickPart = new Tone.Part((time) => {
            if (Math.random() > 0.5) {
                this.kick.triggerAttackRelease("C2", "8n", time, 0.25);
            }
        }, [
            ["0:0:0", null],
            ["0:1:0", null],
            ["1:0:0", null],
            ["1:1:0", null]
        ]);

        this.kickPart.loop = true;
        this.kickPart.loopEnd = loopLength;

        this.hatLoop = new Tone.Loop((time) => {
            const vel = 0.05 + Math.random() * 0.05;
            this.hat.triggerAttackRelease("16n", time, vel);
        }, "8n");
    }

    public play(): void {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = 100;
        Tone.Transport.start();

        this.leadPart?.start(0);
        this.kickPart?.start(0);
        this.hatLoop?.start(0);

        this.isPlaying = true;
    }

    public stop(): void {
        if (!this.isPlaying) return;

        this.leadPart?.stop();
        this.kickPart?.stop();
        this.hatLoop?.stop();

        Tone.Transport.stop();
        this.isPlaying = false;
    }

    public reset(): void {
        this.stop();

        this.leadPart?.dispose();
        this.kickPart?.dispose();
        this.hatLoop?.dispose();

        this.leadPart = null;
        this.kickPart = null;
        this.hatLoop = null;

        this.createLoop();
    }
}
