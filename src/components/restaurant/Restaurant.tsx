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
import Utils from "../../utils/Utils";
import { DATE_FORMAT, DISPLAY_DATE_FORMAT } from "../../utils/Statics";
import withTutorialStarter from "../../hooks/TutorialStarter";

dayjs.extend(customFormat);
export default function Restaurant() {
    const [dishes, setDishes] = useState<RestaurantDish[]>([]);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pageCount, setTotalPageCount] = useState<number>(0);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const dishes = await RestaurantLoader.loadRestaurantData();
            setDishes(dishes);
            const pages = await RestaurantLoader.getTotalNumberOfPages();
            setTotalPageCount(pages);
            setLoading(false);
        })();
    }, []);

    const loadPage = async (page: number) => {
        if (page == currentPage) return;
        if (page > pageCount - 1) return;
        setCurrentPage(page);
        setDishes(await RestaurantLoader.loadDishesSortedAfter(currentButtonSorted.current ?? undefined, page));
    }

    withTutorialStarter("openedRestaurant");

    const newestButtonRef = useRef<HTMLButtonElement>(null);
    const oldestButtonRef = useRef<HTMLButtonElement>(null);
    const flavorCountButtonRef = useRef<HTMLButtonElement>(null);
    const currentButtonSorted = useRef<"newest" | "oldest" | "flavorCount">(null);

    const gameState = useGameState();

    const clearButtonRef = useRef<HTMLButtonElement>(null);

    const stopPlaybacks = useRef<(() => void)[]>([]);

    const onClick = async (sortAfter: "newest" | "oldest" | "flavorCount") => {
        clearAllSelected();

        if (newestButtonRef.current && sortAfter == "newest") newestButtonRef.current.classList.add("toggled");
        if (oldestButtonRef.current && sortAfter == "oldest") oldestButtonRef.current.classList.add("toggled");
        if (flavorCountButtonRef.current && sortAfter == "flavorCount") flavorCountButtonRef.current.classList.add("toggled");

        currentButtonSorted.current = sortAfter;

        stopPlaybacks.current.forEach(e => e());

        setLoading(true);
        setDishes(await RestaurantLoader.loadDishesSortedAfter(sortAfter, currentPage));

        if (currentButtonSorted.current != sortAfter) return;
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
                <PixelDiv className="pages">
                    <div className="bg"></div>
                    {
                        currentPage > 0 && <PixelButton onClick={() => loadPage(0)}>{1}</PixelButton>
                    }
                    {
                        currentPage - 1 > 0 && <>
                            <div className="gap"></div>
                            <PixelButton onClick={() => loadPage(currentPage - 1)}>{currentPage - 1 + 1}</PixelButton>
                        </>
                    }
                    <PixelButton className="currentPage">{currentPage + 1}</PixelButton>
                    {
                        currentPage + 1 < pageCount - 1 && <>
                            <PixelButton onClick={() => loadPage(currentPage + 1)}>{currentPage + 1 + 1}</PixelButton>
                            <div className="gap"></div>
                        </>
                    }
                    {
                        pageCount > 1 && currentPage < pageCount - 1 && <PixelButton onClick={() => loadPage(pageCount - 1)}>{pageCount}</PixelButton>
                    }
                </PixelDiv>
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

    const mainFlavorsPlayer = getMainFlavorByName(dish.mainFlavor);
    const playerRef = useRef(new ElementPlayer());

    const containsSolo = dish.tracks.filter(e => e.solo).length > 0;
    const elements = dish.tracks.filter(e => (e.solo && containsSolo) || !containsSolo).filter(e => e.volume != 0).filter(e => !e.muted).flatMap(line => line.elements.map(el => ({ ...el, lineUuid: Utils.uuidv4() })));


    const updateProgresssBar = () => {

        if (endTimeRef.current == -1) return;
        if (Tone.getTransport().seconds >= endTimeRef.current) {
            stoppedPlaying();
        }
        const timeTaken = Tone.getTransport().seconds;
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

    const clickedPlay = async () => {

        if (isPlaying) {
            stoppedPlaying();
            return;
        }

        // startedPlayback();

        // if (elements.length == 0) return;

        // Tone.getTransport().stop();
        // Tone.getTransport().position = "0:0:0";
        // Tone.getTransport().bpm.value = 110;

        // playerRef.current.setVolumes(dish.volumes);
        // playerRef.current.loadElements(elements.map(e => ({ ...createElementForFlavor(e.flavor, e.from, e.to), lineUuid: e.lineUuid })));
        // endTimeRef.current = await playerRef.current.play(0);

        // if (!containsSolo) {
        //     mainFlavorsPlayer?.setVolumes(dish.volumes);
        //     mainFlavorsPlayer?.play(0);
        // }

        // clockRef.current.start();

        // startTime.current = Tone.now();
        // updateProgresssBar();

        // setPlaying(true);

        // Tone.getTransport().start("0", "0:0:0");
        // Tone.start();

        startedPlayback();

        await Tone.start();

        Tone.getTransport().stop();
        Tone.getTransport().cancel("0:0:0");
        Tone.getTransport().bpm.value = 110;

        const startTime = 0;

        playerRef.current.stop();
        playerRef.current.disposeAll();
        playerRef.current.setVolumes(dish.volumes);
        playerRef.current.loadElements(elements.map(e => ({ ...createElementForFlavor(e.flavor, e.from, e.to), lineUuid: e.lineUuid })));

        if (!containsSolo) {
            mainFlavorsPlayer?.stop();
            mainFlavorsPlayer?.setVolumes(dish.volumes);
            await mainFlavorsPlayer?.play(startTime);
        }

        endTimeRef.current = await playerRef.current.play(startTime);

        setPlaying(true);
        Tone.getTransport().start(Tone.now(), "0:0:0");
        clockRef.current.start();
        updateProgresssBar();


    };

    return <div className="dish">
        {
            isPlaying && <PixelDiv className="progress-bar"><progress ref={progressBarRef} max={100}></progress></PixelDiv>
        }
        <div className="image">
            <img src={!!dish.share?.aiImage ? dish.share?.aiImage : "./imgs/dishList/no-image-image.png"} alt="Dish List Image" />
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
        <span className="creation-date">{dayjs(dish.createdAt, DATE_FORMAT).format(DISPLAY_DATE_FORMAT)}</span>
        <span className="name">{dish.name}</span>
    </div>
}