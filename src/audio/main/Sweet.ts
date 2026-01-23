import * as Tone from "tone";
import FlavorMusic from "../FlavorMusic";
import { MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors";

export default class Sweet extends FlavorMusic {
    public FLAVOR_NAME: MainFlavor = "Sweet";
    public IMAGE: string = MAIN_FLAVOR_IMAGES["Sweet"];

    private pad: Tone.PolySynth;
    private bell: Tone.Synth;
    private arpeggio: Tone.Synth;

    private reverb: Tone.Reverb;
    private chorus: Tone.Chorus;
    private filter: Tone.Filter;

    private padPart: Tone.Part | null = null;
    private bellPart: Tone.Part | null = null;
    private arpPart: Tone.Part | null = null;

    private isPlaying = false;

    constructor() {
        super();

        this.reverb = new Tone.Reverb({ decay: 4, wet: 0.25 });
        this.chorus = new Tone.Chorus(1.5, 2.5, 0.2).toDestination();
        this.filter = new Tone.Filter(1200, "lowpass");

        this.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 1.5 }
        })
            .chain(this.filter, this.chorus, this.reverb, Tone.Destination);

        this.bell = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 1 }
        })
            .chain(this.filter, this.reverb, Tone.Destination);

        this.arpeggio = new Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.4 }
        })
            .chain(this.filter, this.reverb, Tone.Destination);

        this.createLoop();
    }

    private createLoop(): void {
        const loopLength = "2m";

        // Chord progression (pleasant and warm)
        const chords = [
            ["C4", "E4", "G4"],
            ["A3", "C4", "E4"],
            ["F3", "A3", "C4"],
            ["G3", "B3", "D4"]
        ];

        this.padPart = new Tone.Part((time, chord) => {
            this.pad.triggerAttackRelease(chord as string[], "2m", time, 0.3);
        }, chords.map((c, i) => [`${i}:0:0`, c]));

        this.padPart.loop = true;
        this.padPart.loopEnd = loopLength;

        // Bell melody (subtle and sweet)
        const melody = ["E5", "G5", "A5", "G5", "E5", "D5", "C5", "D5"];
        this.bellPart = new Tone.Part((time, note) => {
            this.bell.triggerAttackRelease(note as string, "8n", time, 0.15);
        }, melody.map((n, i) => [`${Math.floor(i / 2)}:${(i % 2) * 2}:0`, n]));

        this.bellPart.loop = true;
        this.bellPart.loopEnd = loopLength;

        // Arpeggio (light texture)
        const arpNotes = ["C5", "E5", "G5", "C6"];
        this.arpPart = new Tone.Part((time, note) => {
            const vel = 0.05 + Math.random() * 0.05;
            this.arpeggio.triggerAttackRelease(note as string, "16n", time, vel);
        }, arpNotes.map((n, i) => [`0:${i}:0`, n]));

        this.arpPart.loop = true;
        this.arpPart.loopEnd = loopLength;

        // Subtle filter sweep to prevent repetition
        const lfo = new Tone.LFO("0.1hz", 800, 1200);
        lfo.connect(this.filter.frequency);
        lfo.start();
    }

    public play(): void {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = 90;
        Tone.Transport.start();

        this.padPart?.start(0);
        this.bellPart?.start(0);
        this.arpPart?.start(0);

        this.isPlaying = true;
    }

    public stop(): void {
        if (!this.isPlaying) return;

        this.padPart?.stop();
        this.bellPart?.stop();
        this.arpPart?.stop();

        Tone.Transport.stop();
        this.isPlaying = false;
    }

    public reset(): void {
        this.stop();

        this.padPart?.dispose();
        this.bellPart?.dispose();
        this.arpPart?.dispose();

        this.padPart = null;
        this.bellPart = null;
        this.arpPart = null;

        this.createLoop();
    }
}
