import "./DishList.scss";
import { useDishes } from "../../contexts/DishesContext";
import dayjs from "dayjs";
import customFormat from "dayjs/plugin/customParseFormat"
import { FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import { useEffect, useRef, useState } from "react";
import type { Dish, LocalDish } from "../../@types/User";
import { useCurrentDish, useCurrentDishIndex } from "../../contexts/CurrentDish";
import { useGameState } from "../../contexts/GameStateContext";
import type { Digit } from "../../@types/Api";
import PixelDiv from "../pixelDiv/PixelDiv";
import PixelButton from "../pixelDiv/PixelButton";
import { ElementPlayer } from "../flavorSynth/ElementPlayer";
import * as Tone from "tone";
import { getMainFlavorByName } from "../../audio/Flavors";
import PixelLI from "../pixelDiv/PixelLI";
import ProgressCanvas from "./ProgressCanvas";

dayjs.extend(customFormat);

export default function DishList() {
    const { dishes, deleteDisheWithUUID } = useDishes();
    const currentElement = useCurrentDishIndex();
    const gameState = useGameState();

    const listRef = useRef<HTMLUListElement>(null);
    const lastClickOffsetRef = useRef({ x: 0, y: 0 });
    const currentSelectedElementRef = useRef<Dish | LocalDish>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const dishListRef = useRef<HTMLDivElement>(null);

    const [currentPlayingUUID, setCurrentPlayingUUID] = useState<string | null>(null);
    const currentStopCallbackFunction = useRef<() => void>(() => 0);
    const progressChangeRef = useRef<(p: number) => void>(() => 0);
    const recordPlayback = useRef<boolean>(false);

    const hideOptions = () => {
        if (!optionsRef.current) return;
        optionsRef.current.classList.remove("opened");
    }

    const showOptions = (x: number, y: number) => {
        y += (dishListRef.current?.scrollTop ?? 0);
        if (!optionsRef.current) return;
        optionsRef.current.style.setProperty("--left", x + "px");
        optionsRef.current.style.setProperty("--top", y + "px");
        optionsRef.current.classList.add("opened");
    };

    const getClickedEntryElement = (element: HTMLElement) => {
        if (!element) return undefined;
        if (!listRef.current) return undefined;
        if (!listRef.current.contains(element)) return undefined;
        if (element.getAttribute("data-list-entry-uuid") != null) {
            return element.getAttribute("data-list-entry-uuid");
        }

        let currentElement: HTMLElement | null = element;

        while (currentElement?.getAttribute("data-list-entry-uuid") == null) {
            currentElement = currentElement?.parentElement ?? null;
            if (!currentElement) return undefined;
        }

        if (currentElement.getAttribute("data-list-entry-uuid") != null) {
            return currentElement.getAttribute("data-list-entry-uuid");
        }

        return undefined;
    }

    const onClickOutside = (e: MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) {
            hideOptions();
            return;
        }

        if (optionsRef.current?.contains(e.target) === true) return;
        if (listRef.current?.contains(e.target) && e.button != 0) return;
        hideOptions();
    };

    const onMenu = (e: MouseEvent) => {

        const box = listRef.current?.getBoundingClientRect();
        if (!box) return;

        if (!(e.target instanceof HTMLElement)) {
            hideOptions();
            return;
        }

        const x = e.clientX - lastClickOffsetRef.current.x;
        const y = e.clientY - lastClickOffsetRef.current.y;

        const listEntryUUID = getClickedEntryElement(e.target);
        if (!listEntryUUID) {
            hideOptions();
            e.preventDefault();
            return;
        }
        currentSelectedElementRef.current = dishes.find(e => e.uuid == listEntryUUID) ?? null;
        showOptions(x, y);

        e.preventDefault();
    };

    const onClickInsideMenu = (e: MouseEvent) => {
        const box = optionsRef.current?.getBoundingClientRect();
        if (!box) return;

        if (!(e.target instanceof HTMLElement)) {
            return;
        }

        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        if (x < 0 || y < 0) {
            lastClickOffsetRef.current = { x: 0, y: 0 };
            return;
        }
        lastClickOffsetRef.current = { x, y };
    };

    useEffect(() => {
        optionsRef.current?.addEventListener("mousedown", onClickInsideMenu);
        window.addEventListener("contextmenu", onMenu);
        window.addEventListener("mousedown", onClickOutside);

        return () => {
            window.removeEventListener("contextmenu", onMenu);
            window.removeEventListener("mousedown", onClickOutside);
            optionsRef.current?.removeEventListener("mousedown", onClickInsideMenu);
        }

    }, []);

    const deleteCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const uuid = dishes.find(e => e.uuid == currentSelectedElementRef.current?.uuid)?.uuid;
        if (!uuid) return;
        deleteDisheWithUUID(uuid);
        hideOptions();
    };

    const shareCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const element = currentSelectedElementRef.current;
        if (!element) return;

        const indexOf = dishes.indexOf(element);
        if (indexOf == -1) return;

        currentElement.setIndex(indexOf);
        gameState.setGameState("createDish-share");

        hideOptions();
    };

    const duplicateCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const element = currentSelectedElementRef.current;
        if (!element) return;

        const indexOf = dishes.indexOf(element);

        let index = 1;
        let newName = element.name + ` (${index})`;

        const names = dishes.map(e => e.name);

        while (names.includes(newName)) {
            index++;
            newName = element.name + ` (${index})`;
        }

        let newUUID = crypto.randomUUID();

        const uuids = dishes.map(e => e.uuid);

        while (uuids.includes(newUUID)) {
            newUUID = crypto.randomUUID();
        }

        const newDish = {
            ...element,
            uuid: newUUID,
            name: newName,
            shares: undefined,
            aiImage: undefined
        };
        gameState.createNewActiveDish(newDish, false, indexOf == -1 ? undefined : indexOf);

        hideOptions();
    };

    const openCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        // currentElement.setIndex((dishes as any[]).indexOf(currentSelectedElementRef.current));
        currentElement.openDishFromObj(currentSelectedElementRef.current);
        gameState.setGameState("createDish-create");
        hideOptions();
    };

    const playDish = async (dish: Dish | LocalDish) => {
        currentStopCallbackFunction.current();

        if (currentPlayingUUID == dish.uuid) {
            setCurrentPlayingUUID(null);
            return;
        }

        const player = new ElementPlayer();
        player.onStop = () => {
            currentStopCallbackFunction.current();
        };

        const mainFlavorsPlayer = getMainFlavorByName(dish.mainFlavor);
        Tone.getTransport().stop();
        Tone.getTransport().position = "0:0:0";
        Tone.getTransport().bpm.value = 110;

        const containsSolo = dish.data.filter(e => e.solo).length > 0;
        const elements = dish.data.filter(e => (e.solo && containsSolo) || !containsSolo).filter(e => e.volume != 0).filter(e => !e.muted).flatMap(line => line.elements.map(el => ({ ...el, lineUuid: line.uuid })));
        if (elements.length == 0) return;
        player.stop();
        player.setVolumes(dish.volumes);
        player.loadElements(elements);

        if (!containsSolo) {
            mainFlavorsPlayer?.setVolumes(dish.volumes);
            mainFlavorsPlayer?.play(0);
        }

        const startTime = Tone.now();

        const endTime = await player.play(0);
        Tone.getTransport().start("0", "0:0:0");
        Tone.start();
        console.log(endTime);

        const clock = new Tone.Clock(() => {
            if (endTime == -1) return;
            const time = Tone.now();
            const timeTaken = time - startTime;
            console.log(timeTaken);
            const percentage = timeTaken / endTime;
            progressChangeRef.current?.(percentage * 100);
        }, 100);
        clock.start();


        let stoppedRecording: () => void = () => 0;

        if (recordPlayback.current) {
            const recorder = new Tone.Recorder();
            recorder.start();
            mainFlavorsPlayer?.connect(recorder);
            player.connect(recorder);


            stoppedRecording = async () => {
                const recording = await recorder.stop();
                const url = URL.createObjectURL(recording);
                const a = document.createElement("a");
                a.href = url;
                a.download = dish.name + ".webm";
                a.click();
                recordPlayback.current = false;
            };

        }


        setCurrentPlayingUUID(dish.uuid);
        currentStopCallbackFunction.current = () => {
            clock.stop();
            player.stop();
            mainFlavorsPlayer?.stop();
            Tone.getTransport().stop();
            setCurrentPlayingUUID(null);
            stoppedRecording();
        };
    };

    const exportAsAudio = () => {
        const dish = currentSelectedElementRef.current;
        if (!dish) return;
        recordPlayback.current = true;
        playDish(dish);
        hideOptions();
    };

    return <div className={"dish-list" + (gameState.gameState == "dishList" ? " visible" : "")} ref={dishListRef}>
        <PixelDiv className="options" ref={optionsRef}>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <PixelButton className="delete" onClick={deleteCurrentSelected}>
                                <img src="./imgs/actionButtons/dishList/delete.png" alt="Delete Button" className="action-btn" />
                                {/* {"\uf1f8"} */}
                            </PixelButton>
                        </td>
                        <td>
                            <PixelButton className="share" onClick={shareCurrentSelected}>
                                <img src="./imgs/actionButtons/dishList/share.png" alt="Share Button" className="action-btn" />
                                {/* {"\uf064"} */}
                            </PixelButton>
                        </td>
                        <td>
                            <PixelButton className="open" onClick={openCurrentSelected}>
                                <img src="./imgs/actionButtons/dishList/open.png" alt="Open button" className="action-btn" />
                            </PixelButton>
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <PixelButton className="duplicate" onClick={exportAsAudio}>
                                <img src="./imgs/actionButtons/dishList/download.png" alt="Export as Audio button" className="action-btn" />
                                {/* {"\uf24d"} */}
                            </PixelButton>
                        </td>
                        <td>
                            <PixelButton className="duplicate" onClick={duplicateCurrentSelected}>
                                <img src="./imgs/actionButtons/dishList/duplicate.png" alt="Duplicate button" className="action-btn" />
                                {/* {"\uf24d"} */}
                            </PixelButton></td>
                    </tr>
                </tbody>
            </table>
            {/* <div className="top-options">
            </div> */}
        </PixelDiv>


        <div className="top">
            <h1>Dish list</h1>
        </div>
        <div className="middle">
            {
                dishes.length > 0 && <ul className="list" ref={listRef}>
                    {
                        dishes.filter(e => !(e as any).temporary).map((dish, i) => {
                            console.log(currentPlayingUUID, dish.uuid);
                            return <PixelLI key={dish.name + i} className={((dish as any).publishState ?? "private") == "private" ? "" : "public"} data-list-entry-uuid={dish.uuid}>
                                <PixelDiv className="ai-image">
                                    <img src={((dish as any).aiImage && (dish as any).aiImage.length != 0 ? (dish as any).aiImage : "./imgs/dishList/no-image-image.png")} alt={dish.name} className="ai-image-image" />
                                    {
                                        dish.data.map(e => e.elements).flat().length > 0 &&
                                        <button className="image-btn" onClick={() => playDish(dish)}>
                                            {
                                                currentPlayingUUID == dish.uuid
                                                &&
                                                <img src="./imgs/actionButtons/dishList/pause.png" alt="Pause" />
                                                ||
                                                <img src="./imgs/actionButtons/dishList/play.png" alt="Play" />
                                            }
                                        </button>
                                    }
                                </PixelDiv>
                                <span className="dish-name">{dish.name}</span>
                                <span className="dish-creation-date">{dayjs((dish as any).dishCreationDate).format("YYYY/MM/DD hh:mm")}</span>
                                <span className="dish-created-by">by {(dish as any).createdBy ?? "Unknown"}</span>
                                <div className="dish-publish-state">
                                    {
                                        (dish as Dish).publishState == "private" && <img src="./imgs/actionButtons/dishList/private-badge.png" alt="Private badge" />
                                    }
                                    {
                                        (dish as Dish).publishState == "published" && <img src="./imgs/actionButtons/dishList/public-badge.png" alt="Public badge" />
                                    }
                                </div>

                                {
                                    currentPlayingUUID == dish.uuid &&
                                    <div className="progress-panel-wrapper">
                                        <ProgressCanvas className="progress-panel" color="#4E2D27" maxProgress={100} progress={0} progressChangeRef={progressChangeRef} />
                                        <PixelDiv className="bg"></PixelDiv>
                                    </div>
                                }

                                {
                                    dish && (dish as Dish).publishState == "published" && (dish as Dish).share && <>
                                        <div className="flavors">{
                                            ((dish as any).share.flavors as Flavor[]).map((flavor, i) => {
                                                return <img key={flavor + i} src={FLAVOR_IMAGES[flavor]} alt={flavor} className="flavor-img" />
                                            })
                                        }</div>
                                        <div className="code">
                                            {
                                                ((dish as any).share.code as Digit[]).map((digit, i) => {
                                                    return <span key={i} className="digit">{digit}</span>
                                                })
                                            }
                                        </div>
                                    </>
                                }
                                {/* <div className="bg">
                                    <div className="left"></div>
                                    <div className="center"></div>
                                    <div className="right"></div>
                                </div> */}
                            </PixelLI>
                        })
                    }
                </ul>
            }
            {
                dishes.length == 0 && <h2>Nothing here! <a onClick={() => gameState.setGameState("createDish-mainFlavor")}>Create a Dish</a></h2>
            }
        </div>
        <div className="bottom"></div>

        <button className="close" onClick={gameState.goBack}>x</button>
    </div>;
}