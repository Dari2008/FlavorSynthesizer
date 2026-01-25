import * as Tone from "tone";
import type { FlavorElement } from "./PlayerTrack";
import { FLAVORS, getFlavorByName } from "../../audio/Flavors";
import type { FlavorFileMusic } from "../../audio/FlavorMusic";

export class ElementPlayer {
    private elements: (FlavorElement & { lineUuid: string })[] = [];
    private players: ElementPlayerPlayer[] = [];
    private cloningPromise: Promise<void[]> = Promise.resolve([]);

    public onStop: (() => void) | null = null;

    constructor() {
    }

    public loadElements(elements: (FlavorElement & { lineUuid: string })[]) {
        this.stop();
        this.players = [];
        this.elements = elements;
        this.cloningPromise = Promise.all(this.elements.map(async el => {
            const flavor = getFlavorByName(el.flavor.name);
            if (!flavor) return;
            const clonedPlayer = await flavor.clone();
            this.players.push({
                element: el,
                player: clonedPlayer,
                play: (from: number, to: number) => {
                    clonedPlayer.playSegment(from, to, 81);
                }
            });
        }));
    }

    private findLastPlayer(): ElementPlayerPlayer | null {
        let lastEnd = 0;
        let currentElement: ElementPlayerPlayer | null = null;
        this.players.forEach(el => {
            const elEnd = el.element.to;
            if (elEnd > lastEnd) {
                lastEnd = elEnd;
                currentElement = el;
            }
        });
        return currentElement;
    }

    public stop() {
        this.players.forEach(({ player }) => {
            player.stopAllBpms();
            player.dispose();
        });
    }

    async play() {
        await this.cloningPromise;
        await Tone.start();
        const now = Tone.now();
        this.players.forEach(({ element, play }) => {
            play(now + element.from, now + element.to);
        });
        const lastElement = this.findLastPlayer();
        if (lastElement) {
            lastElement.player.getPlayer(81).onstop = () => {
                this.onStop?.();
            };
        }
    }

}

type ElementPlayerPlayer = {
    player: FlavorFileMusic;
    element: FlavorElement & { lineUuid: string };
    play: (from: number, to: number) => void;
}