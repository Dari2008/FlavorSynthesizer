import * as Tone from "tone";
import FlavorMusic from "../FlavorMusic";

export default class Bitter extends FlavorMusic {
    public FLAVOR_NAME = "Bitter";

    private bass: Tone.MonoSynth;
    private pad: Tone.PolySynth;
    private noise: Tone.NoiseSynth;

    private reverb: Tone.Reverb;
    private lowpass: Tone.Filter;

    private bassPart: Tone.Part | null = null;
    private padPart: Tone.Part | null = null;
    private noiseLoop: Tone.Loop | null = null;

    private isPlaying = false;

    constructor() {
        super();

        this.reverb = new Tone.Reverb({ decay: 4, wet: 0.2 });
        this.lowpass = new Tone.Filter(600, "lowpass");

        this.bass = new Tone.MonoSynth({
            oscillator: { type: "square" },
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 1.2 }
        }).chain(this.lowpass, this.reverb, Tone.Destination);

        this.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 1.0, decay: 0.8, sustain: 0.5, release: 2.0 }
        }).chain(this.lowpass, this.reverb, Tone.Destination);

        this.noise = new Tone.NoiseSynth({
            noise: { type: "brown" },
            envelope: { attack: 0.2, decay: 0.8, sustain: 0.2, release: 1.2 }
        }).chain(this.lowpass, this.reverb, Tone.Destination);

        this.createLoop();
    }

    private createLoop(): void {
        const loopLength = "2m";

        // Bass line (slow and dark)
        const bassNotes = ["C2", "C2", "G1", "C2"];
        this.bassPart = new Tone.Part((time, note) => {
            const velocity = 0.1 + Math.random() * 0.05;
            this.bass.triggerAttackRelease(note as string, "1m", time, velocity);
        }, bassNotes.map((n, i) => [`${i}:0:0`, n]));

        this.bassPart.loop = true;
        this.bassPart.loopEnd = loopLength;

        // Pad chords (very subtle)
        const chords = [
            ["C3", "G3", "Bb3"],
            ["C3", "G3", "Ab3"],
            ["C3", "F3", "Ab3"],
            ["C3", "Eb3", "G3"]
        ];
        this.padPart = new Tone.Part((time, chord) => {
            this.pad.triggerAttackRelease(chord as string[], "2m", time, 0.15);
        }, chords.map((c, i) => [`${i}:0:0`, c]));

        this.padPart.loop = true;
        this.padPart.loopEnd = loopLength;

        // Noise (sparse, adds tension)
        this.noiseLoop = new Tone.Loop((time) => {
            if (Math.random() > 0.7) {
                this.noise.triggerAttackRelease("4n", time, 0.08);
            }
        }, "2n");
    }

    public play(): void {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = 75;
        Tone.Transport.start();

        this.bassPart?.start(0);
        this.padPart?.start(0);
        this.noiseLoop?.start(0);

        this.isPlaying = true;
    }

    public stop(): void {
        if (!this.isPlaying) return;

        this.bassPart?.stop();
        this.padPart?.stop();
        this.noiseLoop?.stop();

        Tone.Transport.stop();
        this.isPlaying = false;
    }

    public reset(): void {
        this.stop();

        this.bassPart?.dispose();
        this.padPart?.dispose();
        this.noiseLoop?.dispose();

        this.bassPart = null;
        this.padPart = null;
        this.noiseLoop = null;

        this.createLoop();
    }
}
