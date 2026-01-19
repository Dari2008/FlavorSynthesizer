import * as Tone from "tone";
import FlavorMusic from "../FlavorMusic";

export default class Salty extends FlavorMusic {
    public FLAVOR_NAME = "Salty";

    private kick: Tone.MembraneSynth;
    private clap: Tone.NoiseSynth;
    private hat: Tone.MetalSynth;

    private reverb: Tone.Reverb;

    private kickPart: Tone.Part | null = null;
    private clapPart: Tone.Part | null = null;
    private hatLoop: Tone.Loop | null = null;

    private isPlaying = false;

    constructor() {
        super();

        this.reverb = new Tone.Reverb({ decay: 2, wet: 0.1 });

        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 }
        }).toDestination();

        this.clap = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
        }).chain(this.reverb, Tone.Destination);

        this.hat = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.12, release: 0.01 },
            harmonicity: 5.5,
            modulationIndex: 18,
            resonance: 3000,
            octaves: 1.5
        }).toDestination();

        this.hat.frequency.value = 800;

        this.createLoop();
    }

    private createLoop(): void {
        const loopLength = "2m";

        // Kick pattern (subtle, not too loud)
        this.kickPart = new Tone.Part((time) => {
            const velocity = 0.2 + Math.random() * 0.1;
            this.kick.triggerAttackRelease("C2", "8n", time, velocity);
        }, [
            ["0:0:0", null],
            ["0:2:0", null],
            ["1:0:0", null],
            ["1:2:0", null]
        ]);

        this.kickPart.loop = true;
        this.kickPart.loopEnd = loopLength;

        // Clap pattern (soft)
        this.clapPart = new Tone.Part((time) => {
            const velocity = 0.05 + Math.random() * 0.05;
            this.clap.triggerAttackRelease("8n", time, velocity);
        }, [
            ["0:1:0", null],
            ["0:3:0", null],
            ["1:1:0", null],
            ["1:3:0", null]
        ]);

        this.clapPart.loop = true;
        this.clapPart.loopEnd = loopLength;

        // Hat loop
        this.hatLoop = new Tone.Loop((time) => {
            const velocity = 0.05 + Math.random() * 0.05;
            this.hat.triggerAttackRelease("16n", time, velocity);
        }, "8n");
    }

    public play(): void {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = 100;
        Tone.Transport.start();

        this.kickPart?.start(0);
        this.clapPart?.start(0);
        this.hatLoop?.start(0);

        this.isPlaying = true;
    }

    public stop(): void {
        if (!this.isPlaying) return;

        this.kickPart?.stop();
        this.clapPart?.stop();
        this.hatLoop?.stop();

        Tone.Transport.stop();
        this.isPlaying = false;
    }

    public reset(): void {
        this.stop();

        this.kickPart?.dispose();
        this.clapPart?.dispose();
        this.hatLoop?.dispose();

        this.kickPart = null;
        this.clapPart = null;
        this.hatLoop = null;

        this.createLoop();
    }
}
