import Bitter from "./main/Bitter";
import Salty from "./main/Salty";
import Savory from "./main/Savory";
import Sour from "./main/Sour";
import Spicy from "./main/Spicy";
import Sweet from "./main/Sweet";
import FlavorMusic, { FlavorFileMusic } from "./FlavorMusic";

const FLAVORS: FlavorFileMusic[] = [
    new FlavorFileMusic(0, "Vanilla"),
    new FlavorFileMusic(1, "Chocolate"),
    new FlavorFileMusic(2, "Strawberry"),
    new FlavorFileMusic(3, "Mint"),
    new FlavorFileMusic(4, "Lemon"),
    new FlavorFileMusic(5, "Orange"),
    new FlavorFileMusic(6, "Cherry"),
    new FlavorFileMusic(7, "Blueberry"),
    new FlavorFileMusic(8, "Raspberry"),
    new FlavorFileMusic(9, "Blackberry"),
    new FlavorFileMusic(10, "Peach"),
    new FlavorFileMusic(11, "Pineapple"),
    new FlavorFileMusic(12, "Coconut"),
    new FlavorFileMusic(13, "Mango"),
    new FlavorFileMusic(14, "Banana"),
    new FlavorFileMusic(15, "Apple"),
    new FlavorFileMusic(16, "Grape"),
    new FlavorFileMusic(17, "Watermelon"),
    new FlavorFileMusic(18, "Cranberry"),
    new FlavorFileMusic(19, "Pomegranate"),
    new FlavorFileMusic(20, "Lime"),
    new FlavorFileMusic(21, "Ginger"),
    new FlavorFileMusic(22, "Cinnamon"),
    new FlavorFileMusic(23, "Nutmeg"),
    new FlavorFileMusic(24, "Clove"),
    new FlavorFileMusic(25, "Cardamom"),
    new FlavorFileMusic(26, "Pumpkin Spice"),
    new FlavorFileMusic(27, "Caramel"),
    new FlavorFileMusic(28, "Butterscotch"),
    new FlavorFileMusic(29, "Honey"),
    new FlavorFileMusic(30, "Maple"),
    new FlavorFileMusic(31, "Hazelnut"),
    new FlavorFileMusic(32, "Almond"),
    new FlavorFileMusic(33, "Peanut Butter"),
    new FlavorFileMusic(34, "Coffee"),
];



const MAIN_FLAVORS: FlavorMusic[] = [
    new Bitter(),
    new Salty(),
    new Savory(),
    new Sour(),
    new Spicy(),
    new Sweet()
];

export function getFlavorByName(name: string) {
    return FLAVORS.find(e => e.NAME == name);
}

export function getMainFlavorByName(name: string) {
    return MAIN_FLAVORS.find(e => e.FLAVOR_NAME == name);
}

export { FLAVORS, MAIN_FLAVORS };