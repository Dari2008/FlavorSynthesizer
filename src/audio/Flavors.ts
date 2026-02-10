import { FlavorFileMusic, MainFlavorFileMusic, type BPM } from "./FlavorMusic";
import type { MainFlavor } from "../@types/Flavors";

const FLAVORS: FlavorFileMusic[] = [
    new FlavorFileMusic(0, "Apple"),
    new FlavorFileMusic(1, "Banana"),
    new FlavorFileMusic(2, "Blackberry"),
    new FlavorFileMusic(3, "Blueberry"),
    new FlavorFileMusic(4, "Cherry"),
    new FlavorFileMusic(5, "Cranberry"),
    new FlavorFileMusic(6, "Lemon"),
    new FlavorFileMusic(7, "Lime"),
    new FlavorFileMusic(8, "Mango"),
    new FlavorFileMusic(9, "Orange"),
    new FlavorFileMusic(10, "Peach"),
    new FlavorFileMusic(11, "Pineapple"),
    new FlavorFileMusic(12, "Pomegranate"),
    new FlavorFileMusic(13, "Raspberry"),
    new FlavorFileMusic(14, "Strawberry"),
    new FlavorFileMusic(15, "Watermelon"),
    new FlavorFileMusic(16, "Coconut"),
    new FlavorFileMusic(17, "Grapefruit"),
    new FlavorFileMusic(18, "Vanilla"),
    new FlavorFileMusic(19, "Chocolate"),
    new FlavorFileMusic(20, "Caramel"),
    new FlavorFileMusic(21, "Butterscotch"),
    new FlavorFileMusic(22, "Brown Sugar"),
    new FlavorFileMusic(23, "Honey"),
    new FlavorFileMusic(24, "Maple"),
    new FlavorFileMusic(25, "Cinnamon"),
    new FlavorFileMusic(26, "Nutmeg"),
    new FlavorFileMusic(27, "Pumpkin Spice"),
    new FlavorFileMusic(28, "Cookies & Cream"),
    new FlavorFileMusic(29, "Brownie"),
    new FlavorFileMusic(30, "Fudge"),
    new FlavorFileMusic(31, "Marshmallow"),
    new FlavorFileMusic(32, "Smores"),
    new FlavorFileMusic(33, "Cheesecake"),
    new FlavorFileMusic(34, "Tiramisu"),
];



const MAIN_FLAVORS: MainFlavorFileMusic[] = [
    // new Bitter(),
    // new Salty(),
    // new Savory(),
    // new Sour(),
    // new Spicy(),
    // new Sweet()
    new MainFlavorFileMusic("mainFlavors/bitter_finished.wav", "Bitter"),
    new MainFlavorFileMusic("mainFlavors/salty_finished.wav", "Salty"),
    new MainFlavorFileMusic("mainFlavors/savory_finished.wav", "Savory"),
    new MainFlavorFileMusic("mainFlavors/sour_finished.wav", "Sour"),
    new MainFlavorFileMusic("mainFlavors/spicy_finished.wav", "Spicy"),
    new MainFlavorFileMusic("mainFlavors/sweet_finished.wav", "Sweet"),
];

export function getFlavorByName(name: string) {
    return FLAVORS.find(e => e.NAME == name);
}

export function getMainFlavorByName(name: MainFlavor) {
    return MAIN_FLAVORS.find(e => e.NAME == name);
}

export { FLAVORS, MAIN_FLAVORS };

export async function intitializeAllAudios() {
    let all = [];
    all.push(...FLAVORS.map(e => e.download()));
    all.push(MAIN_FLAVORS.map(e => e.download()));
    await Promise.all(all);
}