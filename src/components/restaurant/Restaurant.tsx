import { useRef, useState } from "react";
import { useDishes } from "../../contexts/DishesContext";
import PixelDiv from "../pixelDiv/PixelDiv";
import "./Restaurant.scss";
import type { Dish } from "../../@types/User";
import * as Tone from "tone";
import { ElementPlayer } from "../flavorSynth/ElementPlayer";
import { getMainFlavorByName } from "../../audio/Flavors";
import ProgressCanvas from "../progressCanvas/ProgressCanvas";
import dayjs from "dayjs";
import customFormat from "dayjs/plugin/customParseFormat"

dayjs.extend(customFormat);
export default function Restaurant() {

    const dishes = useDishes();

    const newestButtonRef = useRef<HTMLButtonElement>(null);
    const oldestButtonRef = useRef<HTMLButtonElement>(null);
    const flavorCountButtonRef = useRef<HTMLButtonElement>(null);

    const clearButtonRef = useRef<HTMLButtonElement>(null);

    const onClick = (button: "newest" | "oldest" | "flavorCount") => {
        if (newestButtonRef.current) newestButtonRef.current.classList.remove("toggled");
        if (oldestButtonRef.current) oldestButtonRef.current.classList.remove("toggled");
        if (flavorCountButtonRef.current) flavorCountButtonRef.current.classList.remove("toggled");

        if (newestButtonRef.current && button == "newest") newestButtonRef.current.classList.add("toggled");
        if (oldestButtonRef.current && button == "oldest") oldestButtonRef.current.classList.add("toggled");
        if (flavorCountButtonRef.current && button == "flavorCount") flavorCountButtonRef.current.classList.add("toggled");
    };

    return <div className="restaurant">
        <h1>Restaurant</h1>
        <div className="filters">
            <PixelDiv className="left-filters">
                <button className="toggle-button" onClick={() => onClick("newest")} ref={newestButtonRef}>Newest</button>
                <button className="toggle-button" onClick={() => onClick("oldest")} ref={oldestButtonRef}>Oldest</button>
                <button className="toggle-button" onClick={() => onClick("flavorCount")} ref={flavorCountButtonRef}>Flavor Count</button>
                <button className="clear" ref={clearButtonRef}>x</button>
            </PixelDiv>
        </div>
        <div className="grid">
            {
                dishes.dishes.filter(e => e.type == "dish").map(dish => <RestaurantDish dish={dish} />)
            }
        </div>
    </div>;
}

function RestaurantDish({ dish }: { dish: Dish }) {
    const [isPlaying, setPlaying] = useState<boolean>(false);
    const endTimeRef = useRef<number>(-1);
    const progressChangeRef = useRef<(p: number) => void>(() => 0);

    const mainFlavorsPlayer = getMainFlavorByName(dish.mainFlavor);

    const containsSolo = dish.data.filter(e => e.solo).length > 0;
    const elements = dish.data.filter(e => (e.solo && containsSolo) || !containsSolo).filter(e => e.volume != 0).filter(e => !e.muted).flatMap(line => line.elements.map(el => ({ ...el, lineUuid: line.uuid })));


    const startTime = Tone.now();

    const clock = new Tone.Clock(() => {
        if (endTimeRef.current == -1) return;
        const time = Tone.now();
        const timeTaken = time - startTime;
        const percentage = timeTaken / endTimeRef.current;
        progressChangeRef.current?.(percentage * 100);
    }, 60);

    const stoppedPlaying = () => {
        clock.stop();
        player.stop();
        mainFlavorsPlayer?.stop();
        Tone.getTransport().stop();
        setPlaying(false);
    };

    const player = new ElementPlayer();
    player.onStop = stoppedPlaying;

    const clickedPlay = async () => {

        Tone.getTransport().stop();
        Tone.getTransport().position = "0:0:0";
        Tone.getTransport().bpm.value = 110;

        if (elements.length == 0) return;
        player.stop();
        player.setVolumes(dish.volumes);
        player.loadElements(elements);
        endTimeRef.current = await player.play(0);

        if (!containsSolo) {
            mainFlavorsPlayer?.setVolumes(dish.volumes);
            mainFlavorsPlayer?.play(0);
        }
        Tone.getTransport().start("0", "0:0:0");
        Tone.start();
        clock.start();

        setPlaying(true);

    };

    return <div>
        {
            isPlaying && <ProgressCanvas progress={0} progressChangeRef={progressChangeRef} maxProgress={100} color="#26472a"></ProgressCanvas>
        }
        <img src={dish.share?.aiImage ?? "./imgs/dishList/no-image-image.png"} alt="Dish Image" />
        <span className="created-by">{dish.createdBy}</span>
        <span className="creation-date">{dayjs(new Date(dish.dishCreationDate)).format("YYYY/MM/DD hh:mm")}</span>
        <button className="play" onClick={clickedPlay}>
            {
                isPlaying
                &&
                <img src="./imgs/actionButtons/dishList/pause.png" alt="Pause" />
                ||
                <img src="./imgs/actionButtons/dishList/play.png" alt="Play" />
            }
        </button>
    </div>
}