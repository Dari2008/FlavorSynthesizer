import { useRef, useState } from "react";
import { FlavorFileMusic } from "../../audio/FlavorMusic"

type Props = {
    player: FlavorFileMusic;
}

export default function FlavorDragNDropListItem({ player }: Props) {

    const [isPlaying, setPl] = useState<boolean>(false);
    const playerRef = useRef<FlavorFileMusic>(null);
    const responseWaitRef = useRef<Promise<void | FlavorFileMusic>>(null);
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

    return <li key={player.NAME} className="flavor-drag-n-drop-list-item">
        <img src={player.imageSrc} alt={"heap of " + player.NAME} />
        <span className="name">{player.NAME}</span>
        <button className="play" onClick={() => setPlaying(!isPlaying)} data-content={isPlaying ? "\uf04c" : "\uf04b"}>{isPlaying ? <>&#61516;</> : <>&#61515;</>}</button>
    </li>
}