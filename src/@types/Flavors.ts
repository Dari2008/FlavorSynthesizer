import FLAVOR_COLORS_RAW from "./flavorColors.json";
import FLAVOR_IMAGES_RAW from "./flavorImages.json";
import MAIN_FLAVOR_IMAGES_RAW from "./mainFlavorImages.json";
import MAIN_FLAVOR_COLORS_RAW from "./mainFlavorColors.json";

export type Flavor = "Apple" | "Banana" | "Blackberry" | "Blueberry" | "Cherry" | "Cranberry" | "Lemon" | "Lime" | "Mango" | "Orange" | "Peach" | "Pineapple" | "Pomegranate" | "Raspberry" | "Strawberry" | "Watermelon" | "Coconut" | "Grapefruit" | "Vanilla" | "Chocolate" | "Caramel" | "Butterscotch" | "Brown Sugar" | "Honey" | "Maple" | "Cinnamon" | "Nutmeg" | "Pumpkin Spice" | "Cookies & Cream" | "Brownie" | "Fudge" | "Marshmallow" | "Smores" | "Cheesecake" | "Tiramisu" | "Red Velvet" | "Carrot Cake" | "Snickerdoodle" | "Gingerbread" | "Molasses" | "Cupcake" | "Donut" | "Chocolate Chip Cookie" | "Almond" | "Hazelnut" | "Peanut Butter" | "Pistachio" | "Coffee" | "Espresso" | "Mocha" | "Matcha" | "Chai" | "Earl Grey" | "Green Tea" | "Lavender" | "Rose" | "Lemongrass" | "Basil" | "Rosemary" | "Thyme" | "Garlic" | "Onion" | "Barbecue" | "Teriyaki" | "Soy Sauce" | "Ranch" | "Caesar" | "Balsamic" | "Honey Mustard" | "Pickle" | "Ketchup" | "Mustard" | "Mayonnaise";
export type MainFlavor = "Bitter" | "Salty" | "Savory" | "Sour" | "Spicy" | "Sweet";


export const FLAVOR_COLOR: FlavorColors = FLAVOR_COLORS_RAW;
export const MAIN_FLAVOR_COLOR: MainFlavorColors = MAIN_FLAVOR_COLORS_RAW;

export type FlavorColors = {
    [key in Flavor]: string[];
};
export type MainFlavorColors = {
    [key in MainFlavor]: string[];
};

export const FLAVOR_IMAGES: FlavorImages = FLAVOR_IMAGES_RAW;
export const MAIN_FLAVOR_IMAGES: MainFlavorImages = MAIN_FLAVOR_IMAGES_RAW;

export type FlavorImages = {
    [key in Flavor]: string;
}
export type MainFlavorImages = {
    [key in MainFlavor]: string;
}
