import { loadAndSaveResource } from "../components/ResourceSaver";

export const IMAGES_TO_LOAD: {
    [key in ImageName]: {
        url: string;
        base64?: string;
    };
} = {
    "main_background": {
        url: "./imgs/main_background.png"
    },
    "main_background_repeatable": {
        url: "./imgs/repeatable_background.png"
    },
    "dunno_box": {
        url: "./mainMenu/bg/box_dunno.png"
    },
    "create_dish": {
        url: "./mainMenu/bg/create_new_dish.png"
    },
    "open_shared_dish": {
        url: "./mainMenu/bg/open_shared_dish.png"
    },
    "list_dishes": {
        url: "./mainMenu/bg/list_dishes.png"
    },
    "main_menu_bg": {
        url: "./mainMenu/bg/main_menu_background_background.png"
    },
    "user_account": {
        url: "./mainMenu/user-profile.png"
    },
    "settings": {
        url: "./mainMenu/user-dropdown/settings.png"
    },
    "prev_button": {
        url: "./imgs/actionButtons/prev.png"
    },
    "pause_button": {
        url: "./imgs/actionButtons/pause.png"
    },
    "play_button": {
        url: "./imgs/actionButtons/play.png"
    },
    "next_button": {
        url: "./imgs/actionButtons/next.png"
    },
    "save_button": {
        url: "./imgs/actionButtons/save.png"
    },
    "share_button": {
        url: "./imgs/actionButtons/share.png"
    },
    "nametag_left": {
        url: "./imgs/nameTag/name_tag_left.png"
    },
    "nametag_main": {
        url: "./imgs/nameTag/name_tag_main.png"
    },
    "nametag_right": {
        url: "./imgs/nameTag/name_tag_right.png"
    },
    "dish_list_top": {
        url: "./imgs/dishList/dish-list-background-top.png"
    },
    "dish_list_main": {
        url: "./imgs/dishList/dish-list-background-main.png"
    },
    "dish_list_bottom": {
        url: "./imgs/dishList/dish-list-background-bottom.png"
    },
    "dish_list_noimage": {
        url: "./imgs/dishList/no-image-image.png"
    },
    "create_dish_plus": {
        url: "./imgs/plus/plus.png"
    },
    "share_dish_bg_fruits": {
        url: "./imgs/shareDish-bgs/fruits.png"
    },
    "share_dish_bg_dish": {
        url: "./imgs/shareDish-bgs/dish.png"
    },
    "share_dish_bg_workbench": {
        url: "./imgs/shareDish-bgs/workbench.png"
    }
};

const callbacks: {
    callback: (vals: (string | undefined)[]) => void;
    images: ImageName[];
}[] = []

export function getImage(image: ImageName): string | undefined {
    return IMAGES_TO_LOAD[image].base64;
}

export function setCallbackForImageLoad(images: ImageName[], calback: (vals: (string | undefined)[]) => void) {
    if (areAllFinished(images)) {
        calback(images.map(e => IMAGES_TO_LOAD[e].base64));
    } else {
        callbacks.push({
            callback: calback,
            images
        });
    }
}

function checkAll() {
    for (const callback of callbacks) {
        if (areAllFinished(callback.images)) {
            callback.callback(callback.images.map(e => IMAGES_TO_LOAD[e].base64));
        }
    }
}

function areAllFinished(images: ImageName[]): boolean {
    for (const name of images) {
        if (!IMAGES_TO_LOAD[name].base64) return false;
    }
    return true;
}

export async function loadImage(image: ImageName): Promise<string | undefined> {
    const base64 = await loadAndSaveResource("images", image, IMAGES_TO_LOAD[image].url);
    IMAGES_TO_LOAD[image].base64 = base64;
    checkAll();
    return base64;
}

export type ImageName =
    "main_background" |
    "main_background_repeatable" |
    "dunno_box" |
    "create_dish" |
    "open_shared_dish" |
    "list_dishes" |
    "main_menu_bg" |
    "user_account" |
    "settings" |
    "prev_button" |
    "pause_button" |
    "play_button" |
    "next_button" |
    "save_button" |
    "share_button" |
    "nametag_left" |
    "nametag_main" |
    "nametag_right" |
    "dish_list_top" |
    "dish_list_main" |
    "dish_list_bottom" |
    "dish_list_noimage" |
    "create_dish_plus" |
    "share_dish_bg_fruits" |
    "share_dish_bg_dish" |
    "share_dish_bg_workbench";