import { useEffect, useRef, useState } from "react";
import PixelDiv from "../pixelDiv/PixelDiv";
import "./Restaurant.scss";
import type { RestaurantDish } from "../../@types/User";
import * as Tone from "tone";
import { ElementPlayer } from "../flavorSynth/ElementPlayer";
import { getMainFlavorByName } from "../../audio/Flavors";
import dayjs from "dayjs";
import customFormat from "dayjs/plugin/customParseFormat"
import PixelButton from "../pixelDiv/PixelButton";
import { RestaurantLoader } from "./RestaurantLoader";
import { createElementForFlavor } from "../FlavorUtils";
import ScrollingBackgrundImage from "../scroollingBackgroundImage/ScrollingBackgroundImage";
import Skeleton from "react-loading-skeleton";
import { useGameState } from "../../contexts/GameStateContext";

dayjs.extend(customFormat);
export default function Restaurant() {
    const [dishes, setDishes] = useState<RestaurantDish[]>([]);
    const [isLoading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const dishes = await RestaurantLoader.loadRestaurantData();
            setDishes(dishes);
            setLoading(false);
        })();
    }, []);

    const newestButtonRef = useRef<HTMLButtonElement>(null);
    const oldestButtonRef = useRef<HTMLButtonElement>(null);
    const flavorCountButtonRef = useRef<HTMLButtonElement>(null);
    const currentButtonSorted = useRef<"newest" | "oldest" | "flavorCount">(null);

    const gameState = useGameState();

    const clearButtonRef = useRef<HTMLButtonElement>(null);

    const stopPlaybacks = useRef<(() => void)[]>([]);

    const onClick = async (button: "newest" | "oldest" | "flavorCount") => {
        clearAllSelected();

        if (newestButtonRef.current && button == "newest") newestButtonRef.current.classList.add("toggled");
        if (oldestButtonRef.current && button == "oldest") oldestButtonRef.current.classList.add("toggled");
        if (flavorCountButtonRef.current && button == "flavorCount") flavorCountButtonRef.current.classList.add("toggled");

        currentButtonSorted.current = button;

        setLoading(true);
        setDishes(await RestaurantLoader.loadDishesSortedAfter(button));

        if (currentButtonSorted.current != button) return;
        setLoading(false);
        // switch (button) {
        //     case "newest":
        //         break;
        //     case "oldest":
        //         break;
        //     case "flavorCount":
        //         break;
        // }
    };

    const clearAllSelected = () => {
        if (newestButtonRef.current) newestButtonRef.current.classList.remove("toggled");
        if (oldestButtonRef.current) oldestButtonRef.current.classList.remove("toggled");
        if (flavorCountButtonRef.current) flavorCountButtonRef.current.classList.remove("toggled");
        setLoading(true);
        setDishes(RestaurantLoader.getDishes());
        setLoading(false);
    };

    const startedPlayback = () => {
        stopPlaybacks.current.forEach(e => e());
    };

    const addStopRef = (stop: () => void) => {
        stopPlaybacks.current.push(stop);
    }

    return <div className="restaurant">
        <div className="background"></div>
        <div className="foreground"></div>

        <h1>Restaurant</h1>

        <ScrollingBackgrundImage images={{
            top: "./bgs/restaurant/menu-top.png",
            middle: "./bgs/restaurant/menu-middle.png",
            bottom: "./bgs/restaurant/menu-bottom.png"
        }}
            aspectRatios={{
                top: "174/82",
                bottom: "174/82"
            }}>
            <>

                <h2>Menu</h2>
                <PixelDiv className="filters">
                    <div className="background"></div>
                    <PixelButton className="toggle-button" onClick={() => onClick("newest")} ref={newestButtonRef}>Newest</PixelButton>
                    <PixelButton className="toggle-button" onClick={() => onClick("oldest")} ref={oldestButtonRef}>Oldest</PixelButton>
                    <PixelButton className="toggle-button" onClick={() => onClick("flavorCount")} ref={flavorCountButtonRef}>Flavor Count</PixelButton>
                    <PixelButton className="clear" onClick={clearAllSelected} ref={clearButtonRef}>x</PixelButton>
                </PixelDiv>
            </>

            <div className="grid">
                <div className="wrapper">
                    {
                        isLoading && <>
                            <Skeleton count={4} containerClassName="dish skeleton" enableAnimation inline />
                            <Skeleton count={4} containerClassName="dish skeleton" enableAnimation inline />
                            <Skeleton count={4} containerClassName="dish skeleton" enableAnimation inline />
                            <Skeleton count={4} containerClassName="dish skeleton" enableAnimation inline />
                            <Skeleton count={4} containerClassName="dish skeleton" enableAnimation inline />
                            <Skeleton count={4} containerClassName="dish skeleton" enableAnimation inline />
                        </>
                        ||
                        dishes.map(dish => <RestaurantDish key={dish.uuid} dish={dish} startedPlayback={startedPlayback} stopPlaybackRef={addStopRef} />)
                    }
                </div>
            </div>

            <></>
        </ScrollingBackgrundImage>

        <button className="close" onClick={() => gameState.goBack()}>x</button>
    </div>;
}

function RestaurantDish({ dish, stopPlaybackRef, startedPlayback }: { dish: RestaurantDish; startedPlayback: () => void; stopPlaybackRef: (stop: () => void) => void }) {
    const [isPlaying, setPlaying] = useState<boolean>(false);
    const endTimeRef = useRef<number>(-1);
    const progressBarRef = useRef<HTMLProgressElement>(null);
    const startTime = useRef<number>(Tone.now());

    const mainFlavorsPlayer = getMainFlavorByName(dish.mainFlavor);
    const playerRef = useRef(new ElementPlayer());

    const containsSolo = dish.tracks.filter(e => e.solo).length > 0;
    const elements = dish.tracks.filter(e => (e.solo && containsSolo) || !containsSolo).filter(e => e.volume != 0).filter(e => !e.muted).flatMap(line => line.elements.map(el => ({ ...el, lineUuid: crypto.randomUUID() })));


    const updateProgresssBar = () => {
        if (endTimeRef.current == -1) return;
        const time = Tone.now();
        const timeTaken = time - startTime.current;
        const percentage = timeTaken / endTimeRef.current;
        if (progressBarRef.current) progressBarRef.current.value = percentage * 100;
    };

    const clockRef = useRef(new Tone.Clock(updateProgresssBar, 60));

    const stoppedPlaying = () => {
        clockRef.current.stop();
        playerRef.current.stop();
        mainFlavorsPlayer?.stop();
        Tone.getTransport().stop();
        setPlaying(false);
    };

    useEffect(() => {
        stopPlaybackRef(stoppedPlaying);
    }, [stopPlaybackRef]);

    playerRef.current.onStop = stoppedPlaying;

    const clickedPlay = async () => {

        if (isPlaying) {
            stoppedPlaying();
            return;
        }

        startedPlayback();

        if (elements.length == 0) return;

        Tone.getTransport().stop();
        Tone.getTransport().position = "0:0:0";
        Tone.getTransport().bpm.value = 110;

        playerRef.current.setVolumes(dish.volumes);
        playerRef.current.loadElements(elements.map(e => ({ ...createElementForFlavor(e.flavor, e.from, e.to), lineUuid: e.lineUuid })));
        endTimeRef.current = await playerRef.current.play(0);

        if (!containsSolo) {
            mainFlavorsPlayer?.setVolumes(dish.volumes);
            mainFlavorsPlayer?.play(0);
        }

        clockRef.current.start();

        startTime.current = Tone.now();
        updateProgresssBar();

        setPlaying(true);

        Tone.getTransport().start("0", "0:0:0");
        Tone.start();

    };

    return <div className="dish">
        {
            isPlaying && <PixelDiv className="progress-bar"><progress ref={progressBarRef} max={100}></progress></PixelDiv>
        }
        <div className="image">
            <img src={dish.share?.aiImage ?? "./imgs/dishList/no-image-image.png"} alt="Dish Image" />
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
        <span className="created-by">{dish.createdBy ?? "Unknown"}</span>
        <span className="creation-date">{dayjs(dish.createdAt, "YYYY-MM-DD HH:mm:ss").format("YYYY/MM/DD hh:mm")}</span>
        <span className="name">{dish.name}</span>
    </div>
}