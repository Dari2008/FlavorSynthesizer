import CREATE_NEW_DISH_SELECTION from "./selections/createNewDish.json";
import OPEN_SHARED_DISH_SELECTION from "./selections/openShartedDish.json";
import LIST_DISHES_SELECTION from "./selections/listDishes.json";
import BOX_DUNNO_SELECTION from "./selections/boxDunno.json";
import { useEffect, useRef, useState } from "react";
import type { SelectableElement } from "../initialMenu/InitialMenu";
import withDebounce from "../../hooks/Debounce";


const SELECTION_FILES: SelectionFiles = {
    "create-new-dish": {
        data: CREATE_NEW_DISH_SELECTION as any as SelectionFile,
        ...getBounds(CREATE_NEW_DISH_SELECTION as any as SelectionFile),
    },
    "list-dishes": {
        data: LIST_DISHES_SELECTION as any as SelectionFile,
        ...getBounds(LIST_DISHES_SELECTION as any as SelectionFile),
    },
    "open-shared-dish": {
        data: OPEN_SHARED_DISH_SELECTION as any as SelectionFile,
        ...getBounds(OPEN_SHARED_DISH_SELECTION as any as SelectionFile),
    },
    "box-dunno": {
        data: BOX_DUNNO_SELECTION as any as SelectionFile,
        ...getBounds(BOX_DUNNO_SELECTION as any as SelectionFile),
    }
};

function getBounds(data: SelectionFile) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const [yStr, [xMin, xMax]] of Object.entries(data)) {
        const y = Number(yStr);

        minX = Math.min(minX, xMin);
        maxX = Math.max(maxX, xMax);

        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    if (minX === Infinity) {
        throw new Error("Empty input data");
    }

    return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
    };
}

const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 344;

export default function ImageMenu({ clicked }: { clicked: (element: SelectableElement) => void; }) {

    const clickedWrapped = withDebounce(clicked, 1000);

    const imagesRef = useRef<HTMLDivElement>(null);
    const createNewDishRef = useRef<HTMLImageElement>(null);
    const openSharedDishRef = useRef<HTMLImageElement>(null);
    const listDishesRef = useRef<HTMLImageElement>(null);
    const boxDunnoRef = useRef<HTMLImageElement>(null);

    const [chosenOne, setChosenOne] = useState<keyof SelectionFiles | "none">("none");

    const createNewDishLabelRef = useRef<HTMLSpanElement>(null);
    const openSharedDishLabelRef = useRef<HTMLSpanElement>(null);
    const listDishesLabelRef = useRef<HTMLSpanElement>(null);
    const boxDunnoLabelRef = useRef<HTMLSpanElement>(null);

    // selectedElementWrapper.current = (e) => {
    //     switch (e) {
    //         case "add":
    //             setChosenOne("create-new-dish");
    //             break;
    //         case "open":
    //             setChosenOne("open-shared-dish");
    //             break;
    //         case "list":
    //             setChosenOne("list-dishes");
    //             break;
    //         case "none":
    //             setChosenOne("none")
    //             break;
    //     }
    // };

    function deselectAll() {
        createNewDishRef.current?.classList.remove("selected");
        openSharedDishRef.current?.classList.remove("selected");
        listDishesRef.current?.classList.remove("selected");
        boxDunnoRef.current?.classList.remove("selected");
    }


    const select = (element: keyof SelectionFiles) => {
        deselectAll();
        switch (element) {
            case "create-new-dish":
                createNewDishRef.current?.classList.add("selected");
                break;
            case "list-dishes":
                listDishesRef.current?.classList.add("selected");
                break;
            case "open-shared-dish":
                openSharedDishRef.current?.classList.add("selected");
                break;
            case "box-dunno":
                boxDunnoRef.current?.classList.add("selected");
                break;
        }
    };

    useEffect(() => {
        const images = imagesRef.current;

        if (!images) return;

        function convertImageXYToSelectionXY(
            x: number,
            y: number
        ): Pos {
            const rect = images?.getBoundingClientRect();
            if (!rect) return [0, 0];

            const xRel = x - rect.left;
            const yRel = y - rect.top;

            const scale = Math.max(
                rect.width / IMAGE_WIDTH,
                rect.height / IMAGE_HEIGHT
            );

            const renderWidth = IMAGE_WIDTH * scale;
            const renderHeight = IMAGE_HEIGHT * scale;

            const cropX = (renderWidth - rect.width) / 2;
            const cropY = (renderHeight - rect.height) / 2;

            const imgX = (xRel + cropX) / scale;
            const imgY = (yRel + cropY) / scale;

            return [
                Math.round(imgX),
                Math.round(imgY),
            ];
        }

        function convertSelectionXYToImageXY(
            imgX: number,
            imgY: number
        ): Pos {
            const rect = images?.getBoundingClientRect();
            if (!rect) return [0, 0];

            const scale = Math.max(
                rect.width / IMAGE_WIDTH,
                rect.height / IMAGE_HEIGHT
            );

            const renderWidth = IMAGE_WIDTH * scale;
            const renderHeight = IMAGE_HEIGHT * scale;

            const cropX = (renderWidth - rect.width) / 2;
            const cropY = (renderHeight - rect.height) / 2;

            // Image → element space
            const xRel = imgX * scale - cropX;
            const yRel = imgY * scale - cropY;

            // Element → screen space
            const screenX = xRel + rect.left;
            const screenY = yRel + rect.top;

            return [
                Math.round(screenX),
                Math.round(screenY),
            ];
        }


        function getSelectionIntersection(pos: Pos): undefined | (keyof SelectionFiles) {
            const possibles = Object.keys(SELECTION_FILES).filter((selectionKey) => {
                const selection = SELECTION_FILES[selectionKey as keyof SelectionFiles];
                if (pos[0] < selection.x) return false;
                if (pos[1] < selection.y) return false;
                if (pos[0] > selection.x + selection.w) return false;
                if (pos[1] > selection.y + selection.h) return false;
                return true;
            });
            if (possibles.length == 0) return undefined;
            const y = pos[1];
            const x = pos[0];
            for (const possible of possibles) {
                const pixelPoses = SELECTION_FILES[possible as keyof SelectionFiles].data;
                const pixelPos = pixelPoses[y + ""];
                if (!pixelPos) continue;
                if (x >= pixelPos[0] && x <= pixelPos[1]) return possible as keyof SelectionFiles;
            }
            return undefined;
        }

        function getSubjectPosition(element: keyof SelectionFiles): Pos {
            const data = SELECTION_FILES[element];
            if (!data) return [0, 0];
            const centerX = data.x + data.w / 2;
            const centerY = data.y + data.h / 2;
            return [centerX, centerY];
        }

        function convertPositionToPercentag(pos: Pos): Pos {
            const posImage = convertSelectionXYToImageXY(pos[0], pos[1]);
            const rect = images?.getBoundingClientRect();
            if (!rect) return [0, 0];
            return [
                posImage[0] / rect.width * 100,
                posImage[1] / rect.height * 100
            ];
        }


        const set = (img: HTMLImageElement | null, label: HTMLSpanElement | null, key: keyof SelectionFiles) => {

            if (img && label) {
                const subjectPos = getSubjectPosition(key);
                const percentagPos = convertPositionToPercentag(subjectPos);
                const screenPos = convertSelectionXYToImageXY(subjectPos[0], subjectPos[1]);
                const startPos = convertSelectionXYToImageXY(SELECTION_FILES[key].x, SELECTION_FILES[key].y);
                const endPos = convertSelectionXYToImageXY(SELECTION_FILES[key].x + SELECTION_FILES[key].w, SELECTION_FILES[key].y + SELECTION_FILES[key].h);
                img.style.transformOrigin = `${percentagPos[0]}% ${percentagPos[1]}%`;
                label.style.setProperty("--left", screenPos[0] + "px");
                label.style.setProperty("--top", screenPos[1] + "px");
                label.style.setProperty("--width", (endPos[0] - startPos[0]) + "px");
                label.style.setProperty("--height", (endPos[1] - startPos[1]) + "px");
            }
        }

        set(createNewDishRef.current, createNewDishLabelRef.current, "create-new-dish");
        set(openSharedDishRef.current, openSharedDishLabelRef.current, "open-shared-dish");
        set(listDishesRef.current, listDishesLabelRef.current, "list-dishes");
        set(boxDunnoRef.current, boxDunnoLabelRef.current, "box-dunno");


        const onMouseMove = (e: MouseEvent) => {
            const imagePos = convertImageXYToSelectionXY(e.x, e.y);
            const intersectionElement = getSelectionIntersection(imagePos);
            if (!intersectionElement) {
                deselectAll();
                return;
            }
            select(intersectionElement);
        };

        const onMouseDown = (e: MouseEvent) => {
            const imagePos = convertImageXYToSelectionXY(e.x, e.y);
            const intersectionElement = getSelectionIntersection(imagePos);
            if (!intersectionElement) return;
            switch (intersectionElement) {
                case "create-new-dish":
                    setChosenOne("create-new-dish");
                    break;
                case "list-dishes":
                    setChosenOne("list-dishes");
                    break;
                case "open-shared-dish":
                    setChosenOne("open-shared-dish");
                    break;
                case "box-dunno":
                    setChosenOne("box-dunno");
                    break;
            }

            setTimeout(() => {
                switch (intersectionElement) {
                    case "create-new-dish":
                        clickedWrapped("add");
                        break;
                    case "list-dishes":
                        clickedWrapped("list");
                        break;
                    case "open-shared-dish":
                        clickedWrapped("open");
                        break;
                    case "box-dunno":
                        break;
                }
                setChosenOne("none");
            }, 300);
        };


        images.addEventListener("mousemove", onMouseMove);
        images.addEventListener("mousedown", onMouseDown);

        return () => {
            images.removeEventListener("mousemove", onMouseMove);
            images.removeEventListener("mousedown", onMouseDown);
        };

    });

    return <div className="images" ref={imagesRef}>
        <img src="./mainMenu/bg/main_menu_background_background.png" alt="background Image" className="background-image"></img>

        <img src="./mainMenu/bg/create_new_dish.png" alt="create new dish image" className={"create-new-dish" + (chosenOne == "create-new-dish" ? " chosen" : undefined)} ref={createNewDishRef} />
        <span className="label-for-image above label-for-create-new-dish" ref={createNewDishLabelRef}>Create New Dish</span>

        <img src="./mainMenu/bg/list_dishes.png" alt="list dishes image" className={"list-dishes" + (chosenOne == "list-dishes" ? " chosen" : undefined)} ref={listDishesRef} />
        <span className="label-for-image below label-for-list-dishes" ref={listDishesLabelRef}>List Dishes</span>

        <img src="./mainMenu/bg/open_shared_dish.png" alt="open shared dish image" className={"open-shared-dish" + (chosenOne == "open-shared-dish" ? " chosen" : undefined)} ref={openSharedDishRef} />
        <span className="label-for-image right above label-for-open-shared-dish" ref={openSharedDishLabelRef}>Open Shared Dish</span>

        <img src="./mainMenu/bg/box_dunno.png" alt="dunno box image" className={"dunno-box-dish" + (chosenOne == "box-dunno" ? " chosen" : undefined)} ref={boxDunnoRef} />
        <span className="label-for-image above label-for-box-dunno" ref={boxDunnoLabelRef}>Dunno Box</span>

    </div>;
}

type SelectionFile = {
    [key: string]: [number, number];
}
type SelectionFileCompiled = {
    data: SelectionFile;
    x: number;
    y: number;
    w: number;
    h: number;
}

type SelectionFiles = {
    "create-new-dish": SelectionFileCompiled;
    "list-dishes": SelectionFileCompiled;
    "open-shared-dish": SelectionFileCompiled;
    "box-dunno": SelectionFileCompiled;
}

type Pos = [number, number];