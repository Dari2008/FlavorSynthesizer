import { useRef, useState } from "react";
import { FlavorFileMusic } from "../../audio/FlavorMusic"
import type { Flavor } from "../../@types/Flavors";
import { createElementForFlavor, drawElement, getFlavorHeight, getPixelsPerSecond } from "../FlavorUtils";

type Props = {
    player: FlavorFileMusic;
}

export default function FlavorDragNDropListItem({ player }: Props) {

    const [isPlaying, setPl] = useState<boolean>(false);
    const playerRef = useRef<FlavorFileMusic>(null);
    const responseWaitRef = useRef<Promise<void | FlavorFileMusic>>(null);
    const itemRef = useRef<HTMLLIElement>(null);
    if (playerRef.current == null && responseWaitRef.current == null) responseWaitRef.current = player.clone().then(c => {
        playerRef.current = c;
        playerRef.current.getPlayers().forEach(pl => {
            pl.onstop = (() => {
                setPlaying(false);
            }).bind(playerRef.current);
        });
    });

    const setPlaying = (playing: boolean) => {
        setPl(playing);
        if (playing) {
            playerRef.current?.play(81);
        } else {
            playerRef.current?.stopAllBpms();
        }
    };

    const onDragStart = (e: React.DragEvent<HTMLLIElement>) => {
        e.dataTransfer.setData("text/plain", player.NAME);

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

        e.dataTransfer.setDragImage(createDragImageFor(player.NAME), offsetX, offsetY);
        e.dataTransfer.setData("text/offsetImage", JSON.stringify({ offsetX, offsetY }));
        e.dataTransfer.setData("text/elementLength", DRAG_DEFAULT_LENGTH.toString());
    };

    return <li draggable onDragStart={onDragStart} key={player.NAME} ref={itemRef} className="flavor-drag-n-drop-list-item">
        <img src={player.imageSrc} alt={"heap of " + player.NAME} />
        <span className="name">{player.NAME}</span>
        <button className="play" onClick={() => setPlaying(!isPlaying)} data-content={isPlaying ? "\uf04c" : "\uf04b"}>{isPlaying ? <>&#61516;</> : <>&#61515;</>}</button>
    </li>
}

function createDragImageFor(flavorName: Flavor): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
        return canvas;
    }
    drawElement(createElementForFlavor(flavorName, 0, 10), ctx, 0);
    return canvas;
}