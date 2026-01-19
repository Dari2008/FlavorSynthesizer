import * as Tone from "tone";
import FlavorMusic from "../FlavorMusic";

export default class Savory extends FlavorMusic {
    public FLAVOR_NAME = "Savory";

    private pad: Tone.PolySynth;
    private bass: Tone.MonoSynth;
    private softLead: Tone.Synth;

    private reverb: Tone.Reverb;
    private chorus: Tone.Chorus;

    private padPart: Tone.Part | null = null;
    private bassPart: Tone.Part | null = null;
    private leadPart: Tone.Part | null = null;

    private isPlaying = false;

    constructor() {
        super();

        this.reverb = new Tone.Reverb({ decay: 4, wet: 0.25 });
        this.chorus = new Tone.Chorus(1.2, 2.5, 0.2).toDestination();

        this.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.8, decay: 0.4, sustain: 0.7, release: 1.5 }
        })
            .chain(this.chorus, this.reverb, Tone.Destination);

        this.bass = new Tone.MonoSynth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 1.0 }
        }).toDestination();

        this.softLead = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 1.0 }
        }).chain(this.reverb, Tone.Destination);

        this.createLoop();
    }

    private createLoop(): void {
        const loopLength = "2m";

        // Pad chords (warm and full)
        const chords = [
            ["D4", "F#4", "A4"],
            ["B3", "D4", "F#4"],
            ["G3", "B3", "D4"],
            ["A3", "C#4", "E4"]
        ];

        this.padPart = new Tone.Part((time, chord) => {
            this.pad.triggerAttackRelease(chord as string[], "2m", time, 0.25);
        }, chords.map((c, i) => [`${i}:0:0`, c]));

        this.padPart.loop = true;
        this.padPart.loopEnd = loopLength;

        // Bassline (subtle, warm)
        const bassline = ["D2", "B1", "G1", "A1"];
        this.bassPart = new Tone.Part((time, note) => {
            this.bass.triggerAttackRelease(note as string, "1m", time, 0.15);
        }, bassline.map((n, i) => [`${i}:0:0`, n]));

        this.bassPart.loop = true;
        this.bassPart.loopEnd = loopLength;

        // Soft lead (gentle melodic texture)
        const melody = ["F#4", "A4", "B4", "A4"];
        this.leadPart = new Tone.Part((time, note) => {
            const vel = 0.1 + Math.random() * 0.1;
            this.softLead.triggerAttackRelease(note as string, "8n", time, vel);
        }, melody.map((n, i) => [`${i}:1:0`, n]));

        this.leadPart.loop = true;
        this.leadPart.loopEnd = loopLength;
    }

    public play(): void {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = 85;
        Tone.Transport.start();

        this.padPart?.start(0);
        this.bassPart?.start(0);
        this.leadPart?.start(0);

        this.isPlaying = true;
    }

    public stop(): void {
        if (!this.isPlaying) return;

        this.padPart?.stop();
        this.bassPart?.stop();
        this.leadPart?.stop();

        Tone.Transport.stop();
        this.isPlaying = false;
    }

    public reset(): void {
        this.stop();

        this.padPart?.dispose();
        this.bassPart?.dispose();
        this.leadPart?.dispose();

        this.padPart = null;
        this.bassPart = null;
        this.leadPart = null;

        this.createLoop();
    }
}
