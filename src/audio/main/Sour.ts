import * as Tone from "tone";
import FlavorMusic from "../FlavorMusic";

export default class Sour extends FlavorMusic {
    public FLAVOR_NAME = "Sour";

    private lead: Tone.Synth;
    private arp: Tone.Synth;
    private hat: Tone.MetalSynth;

    private chorus: Tone.Chorus;
    private reverb: Tone.Reverb;

    private leadPart: Tone.Part | null = null;
    private arpPart: Tone.Part | null = null;
    private hatLoop: Tone.Loop | null = null;

    private isPlaying = false;

    constructor() {
        super();

        this.chorus = new Tone.Chorus(1.5, 2.5, 0.2).toDestination();
        this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.2 });

        this.lead = new Tone.Synth({
            oscillator: { type: "square" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.15 }
        }).chain(this.chorus, this.reverb, Tone.Destination);

        this.arp = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.1 }
        }).chain(this.reverb, Tone.Destination);

        this.hat = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            harmonicity: 5.5,
            modulationIndex: 18,
            resonance: 4000,
            octaves: 2
        }).toDestination();

        this.hat.frequency.value = 700;

        this.createLoop();
    }

    private createLoop(): void {
        const loopLength = "2m";

        // Lead staccato pattern
        const leadNotes = ["G5", "F5", "E5", "D5", "C5", "D5", "E5", "F5"];
        this.leadPart = new Tone.Part((time, note) => {
            const velocity = 0.15 + Math.random() * 0.1;
            this.lead.triggerAttackRelease(note as string, "16n", time, velocity);
        }, leadNotes.map((n, i) => [`${Math.floor(i / 2)}:${(i % 2) * 2}:0`, n]));

        this.leadPart.loop = true;
        this.leadPart.loopEnd = loopLength;

        // Arpeggio (sharp and bright)
        const arpNotes = ["C6", "E6", "G6", "B6"];
        this.arpPart = new Tone.Part((time, note) => {
            const velocity = 0.08 + Math.random() * 0.08;
            this.arp.triggerAttackRelease(note as string, "32n", time, velocity);
        }, arpNotes.map((n, i) => [`0:${i}:0`, n]));

        this.arpPart.loop = true;
        this.arpPart.loopEnd = loopLength;

        // Hat loop (light and crisp)
        this.hatLoop = new Tone.Loop((time) => {
            const velocity = 0.05 + Math.random() * 0.05;
            this.hat.triggerAttackRelease("16n", time, velocity);
        }, "8n");
    }

    public play(): void {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = 110;
        Tone.Transport.start();

        this.leadPart?.start(0);
        this.arpPart?.start(0);
        this.hatLoop?.start(0);

        this.isPlaying = true;
    }

    public stop(): void {
        if (!this.isPlaying) return;

        this.leadPart?.stop();
        this.arpPart?.stop();
        this.hatLoop?.stop();

        Tone.Transport.stop();
        this.isPlaying = false;
    }

    public reset(): void {
        this.stop();

        this.leadPart?.dispose();
        this.arpPart?.dispose();
        this.hatLoop?.dispose();

        this.leadPart = null;
        this.arpPart = null;
        this.hatLoop = null;

        this.createLoop();
    }
}
