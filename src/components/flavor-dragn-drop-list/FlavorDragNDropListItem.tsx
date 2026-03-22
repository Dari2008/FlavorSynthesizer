import { useRef, useState } from "react";
import { CustomFlavorMusic, FlavorFileMusic } from "../../audio/FlavorMusic"
import { type Flavor } from "../../@types/Flavors";
import { createElementForFlavor, drawElement, FLAVOR_HEIGHT, getFlavorHeight, getPixelsPerSecond } from "../FlavorUtils";
import { useCurrentDraggingElement } from "../../contexts/CurrentDraggingElementTouch";
import setCurrentDragging from "../flavorSynth/CurrentDraggingReference";

type Props = {
    player: FlavorFileMusic | CustomFlavorMusic;
    hasDownloaded: boolean;
    isCustomFlavor: boolean;
}

export default function FlavorDragNDropListItem({ player, hasDownloaded, isCustomFlavor }: Props) {

    const [isPlaying, setPl] = useState<boolean>(false);
    const [isCurrentlySelectedElement, setIsCurrentlySelectedElement] = useState<boolean>(false);
    const playerRef = useRef<FlavorFileMusic | CustomFlavorMusic>(null);
    const responseWaitRef = useRef<Promise<void | FlavorFileMusic | CustomFlavorMusic>>(null);
    const itemRef = useRef<HTMLLIElement>(null);
    const flavorImage = useRef<HTMLImageElement>(null);

    const currentDragging = useCurrentDraggingElement();

    // const isTouch = useTouchChecker().isTouch;

    const deselect = () => {
        setIsCurrentlySelectedElement(false);
    };

    currentDragging.setDeselectAllCallback(player.NAME, deselect);

    if (playerRef.current == null && responseWaitRef.current == null && hasDownloaded) responseWaitRef.current = player.clone().then(c => {
        playerRef.current = c;
        playerRef.current.getPlayer().onstop = (() => {
            setPlaying(false);
        }).bind(playerRef.current);
    });

    const setPlaying = (playing: boolean) => {
        setPl(playing);
        if (playing) {
            playerRef.current?.play();
        } else {
            playerRef.current?.stopAllBpms();
        }
    };

    const image = createDragImageFor(player.NAME);

    const onDragStart = (e: React.DragEvent<HTMLLIElement>) => {
        e.dataTransfer.setData("flavor/plain", player.NAME);

        console.log("Started dreaging", player.NAME);

        const x = e.clientX;
        const y = e.clientY;

        const DRAG_DEFAULT_LENGTH = 10;

        const width = itemRef.current?.offsetWidth ?? 0;
        const height = itemRef.current?.offsetHeight ?? 0;

        const currentOffsetX = x - (itemRef.current?.getBoundingClientRect().left ?? 0);
        const currentOffsetY = y - (itemRef.current?.getBoundingClientRect().top ?? 0);

        const percentageX = currentOffsetX / width;
        const percentageY = currentOffsetY / height;

        const newHeight = getFlavorHeight();
        const pixelsPerSecond = getPixelsPerSecond();
        const offsetX = percentageX * DRAG_DEFAULT_LENGTH * pixelsPerSecond;
        const offsetY = percentageY * newHeight;


        e.dataTransfer.setData("flavor/offsetImage", JSON.stringify({ offsetX, offsetY }));
        e.dataTransfer.setData("flavor/elementLength", DRAG_DEFAULT_LENGTH.toString());
        e.dataTransfer.setData("flavor/isCustom", (isCustomFlavor ? 1 : 0) + "");
        e.dataTransfer.setDragImage(image, offsetX, offsetY);

        setCurrentDragging(player.NAME, { offsetX, offsetY }, DRAG_DEFAULT_LENGTH);
    };

    // const onClick = () => {
    //     if (!isTouch) return;
    //     currentDragging.currentDraggingElement.current = player.NAME;
    //     currentDragging.deselectAll();
    //     setIsCurrentlySelectedElement(true);
    // };

    return <li draggable onDragStart={onDragStart} key={player.NAME} ref={itemRef} className={`flavor-drag-n-drop-list-item ${isCurrentlySelectedElement ? "selected" : ""}`} style={{
        "--border-color-1": (player.colors[0]),
        "--border-color-2": (player.colors[1])
    } as any}>
        <button className="play" onClick={() => setPlaying(!isPlaying)} data-content={isPlaying ? "\uf04c" : "\uf04b"}>{isPlaying ? <>&#61516;</> : <>&#61515;</>}</button>
        <div className="wrapper">
            <div className="border-wrapper">
                <img src={player.imageSrc} ref={flavorImage} />
                <span className="name">{player.NAME}</span>
            </div>
        </div>
    </li>
}

function createDragImageFor(flavorName: Flavor): HTMLImageElement {
    const canvas = document.createElement("canvas");
    canvas.width = 10 * getPixelsPerSecond();
    canvas.height = FLAVOR_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
        return new Image();
    }
    drawElement(createElementForFlavor(flavorName, 0, 10), ctx);

    const img = new Image();
    img.src = canvas.toDataURL();
    img.style.visibility = "hidden";
    return img;
}

// function hexToRgbValues(hex: string): string {
//     // Remove leading '#'
//     const cleanHex = hex.replace('#', '');

//     // Convert shorthand (#RGB) to full form (#RRGGBB)
//     const fullHex = cleanHex.length === 3
//         ? cleanHex.split('').map(ch => ch + ch).join('')
//         : cleanHex;

//     // Parse the values
//     const r = parseInt(fullHex.slice(0, 2), 16);
//     const g = parseInt(fullHex.slice(2, 4), 16);
//     const b = parseInt(fullHex.slice(4, 6), 16);

//     return `${r}, ${g}, ${b}`;
// }
