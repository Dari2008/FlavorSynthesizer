import * as Tone from "tone";
import type { FlavorElement } from "./PlayerTrack";
import { FLAVORS, getFlavorByName } from "../../audio/Flavors";
import type { FlavorFileMusic } from "../../audio/FlavorMusic";
import type { DishVolumes } from "../../@types/User";

export class ElementPlayer {
    private elements: (FlavorElement & { lineUuid: string })[] = [];
    private players: ElementPlayerPlayer[] = [];
    private cloningPromise: Promise<void[]> = Promise.resolve([]);
    private volumes: DishVolumes = {
        flavors: 100,
        mainFlavor: 100,
        master: 100
    };

    public onStop: (() => void) | null = null;

    constructor() {
    }

    public setVolumes(volumes: DishVolumes) {
        this.volumes = volumes;
        this.players.forEach(({ player }) => {
            player.getPlayers().forEach(e => e.volume.value = this.getVolumeFor("flavors"));
        });
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
                    clonedPlayer.playSegment(from, to, 110);
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

    async play(offset: number = 0) {
        await this.cloningPromise;
        await Tone.start();
        const now = Tone.now() - offset;
        this.players.forEach(({ element, player, play }) => {
            if (element.to <= offset) return;
            player.getPlayers().forEach(e => e.volume.value = this.getVolumeFor("flavors"));
            play(now + element.from, now + element.to);
        });
        const lastElement = this.findLastPlayer();
        if (lastElement) {
            lastElement.player.getPlayer(81).onstop = () => {
                this.onStop?.();
            };
            if (lastElement.element.to <= offset) {
                this.onStop?.();
            }
        }
    }

    percentToDb(percent: number) {
        if (percent <= 0) return -Infinity;
        return 20 * Math.log10(percent);
    }

    private getVolumeFor(vol: "flavors" | "mainFlavor"): number {
        const percentageMaster = this.volumes.master / 100;
        const percentageFlavors = this.volumes.flavors / 100;
        const percentagMainFlavors = this.volumes.mainFlavor / 100;
        switch (vol) {
            case "flavors":
                return this.percentToDb(percentageFlavors * percentageMaster);
            case "mainFlavor":
                return this.percentToDb(percentagMainFlavors * percentageMaster);
        }
        return 0;
    }

}

type ElementPlayerPlayer = {
    player: FlavorFileMusic;
    element: FlavorElement & { lineUuid: string };
    play: (from: number, to: number) => void;
}