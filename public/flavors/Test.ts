import type FlavorMusic from "../FlavorMusic";
import * as Tone from "tone";
import getSamples from "@generative-music/samples-alex-bainter";

export class TestFlavor implements FlavorMusic {

    public FLAVOR_NAME: string = "Test";

    private base?: Tone.Player;
    private effects: Tone.Player[] = [];
    private scheduledId?: number;

    public async play(): Promise<void> {
        await Tone.start();

        Tone.Transport.stop();
        Tone.Transport.cancel();
        Tone.Transport.bpm.value = 90;
        Tone.Transport.timeSignature = 4;

        const samples = getSamples({ format: "wav" });

        this.base = new Tone.Player(samples.piano.loop).toDestination();
        this.base.loop = true;
        this.base.loopEnd = "4m";

        this.effects = [
            new Tone.Player(samples.bells.hit),
            new Tone.Player(samples.mallets.hit),
            new Tone.Player(samples.percussion.hit)
        ].map(p => p.toDestination());

        this.base.start(0);

        this.scheduledId = Tone.Transport.scheduleRepeat(() => {
            if (Math.random() < 0.6) {
                const fx = this.effects[
                    Math.floor(Math.random() * this.effects.length)
                ];
                fx.start(Tone.now());
            }
        }, "1m");

        Tone.Transport.start();
    }

    public reset(): void {
        if (!this.base) return;

        Tone.Transport.stop();
        Tone.Transport.position = "0:0:0";
        this.base.start(0);
        Tone.Transport.start();
    }

    public stop(): void {
        Tone.Transport.stop();
        Tone.Transport.cancel();

        this.base?.stop();
        this.base?.dispose();
        this.effects.forEach(e => {
            e.stop();
            e.dispose();
        });

        this.base = undefined;
        this.effects = [];
    }
}
