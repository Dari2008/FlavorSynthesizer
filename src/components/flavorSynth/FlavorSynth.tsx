import { useEffect, useRef, useState } from "react"
import { SynthLinesContext } from "../../contexts/SynthLinesContext";
import { calculateCurrentPosSeconds, constrainSpan, getSpan, setSpan, setSpanFirstTime } from "../FlavorUtils";
import type { FlavorElement } from "./PlayerTrack";
import { ElementPlayer } from "./ElementPlayer";
import * as Tone from "tone";
import "./FlavorSynth.scss"
import "./FlavorSynthControls.scss";
import { getMainFlavorByName } from "../../audio/Flavors";
import { CurrentInterPlayerDragContext } from "../../contexts/CurrentInterPlayerDragContext";
import { SynthSelectorContext } from "../../contexts/SynthSelectorContext";
import { CurrentlyPlayingContext } from "../../contexts/CurrentlyPlayingContext";
import SynthLine from "./synthLine/SynthLine";
import FlavorStatistic from "./flavorStatistic/FlavorStatistic";
import ControlKnob from "./controlKnob/ControlKnob";
import { useSynthChange } from "../../contexts/SynthChangeContext";
import { useMainFlavor } from "../../contexts/MainFlavorContext";
import { useGameState } from "../../contexts/GameStateContext";
import { useDishes } from "../../contexts/DishesContext";
import { useCurrentDishActions } from "../../contexts/DishActions";
import { ActionHistoryManager } from "./actionHistory/ActionHistoryManager";
import PixelDiv from "../pixelDiv/PixelDiv";
import { FlavorSynthContextMenu } from "../../contexts/FlavorSynthContextMenuContext";
import { useTouchChecker } from "../../contexts/TouchCheckerContext";
import { useCurrentDish } from "../../contexts/CurrentDish";
import Utils from "../../utils/Utils";
import withTutorialStarter from "../../hooks/TutorialStarter";
import { useTutorials } from "../tutorials/context/TutorialContext";
import { useMultiplayer } from "../../contexts/MultiplayerContext";
import type { UUID } from "../../@types/User";
import { useCustomFlavors } from "../../contexts/CustomFlavors";


type EventListWithUUID<T> = {
    [uuid: string]: T;
};
const SKIP_SIZE = 1;

export default function FlavorSynth() {
    // const [synthLines, setSynthLines] = synthLinesWrapped;

    const mainFlavor = useMainFlavor();
    const gameState = useGameState();

    const isReadonly = gameState.gameState == "createDish-create-viewonly";

    const widthRef = useRef<number>(getCurrentTrackWidth(isReadonly));
    // const currentSpanRef = useRef<CurrentSpan>({ from: 0, to: 60 });
    const currentZoomRef = useRef<number>(1);
    const focusedSynthRef = useRef<string | null>(null);
    const selectedElementsRef = useRef<string[]>([]);
    const playerRef = useRef<ElementPlayer>(new ElementPlayer());
    const [isPlaying, setPlaying] = useState<boolean>(false);
    const isPlayingRef = useRef<boolean>(false);
    const isSoloPlay = useRef<boolean>(false);
    const currentPositionRef = useRef<number>(0);
    const currentPlayingOffsetRef = useRef<number>(0);
    // const currentFrameId = useRef<number>(-1);

    const mainFlavorsPlayer = getMainFlavorByName(mainFlavor.mainFlavor);
    const synthSelectionChangeCallbacks = useRef<EventListWithUUID<() => void>>({});
    // const synthRepaintCallbacks = useRef<EventListWithUUID<() => void>>({});
    const currentPosRepainters = useRef<EventListWithUUID<() => void>>({});
    const timelineRepainters = useRef<EventListWithUUID<() => void>>({});
    const elementsRepainters = useRef<EventListWithUUID<() => void>>({});
    const collisionCheckerCallbacks = useRef<EventListWithUUID<(fromOffset: number, toOffset: number) => boolean>>({});
    const onElementMoveCallbacks = useRef<EventListWithUUID<(secondsOffset: number) => void>>({});
    const resizeCallbacks = useRef<EventListWithUUID<(fromOffset: number, toOffset: number) => void>>({});
    const stopDraggingCallbacks = useRef<EventListWithUUID<() => void>>({});
    const cusorPos = useRef<number>(0);

    const currentPlayingFlavorCountRef = useRef<HTMLSpanElement>(null)
    const totalAmountOfFlavorsRef = useRef<HTMLSpanElement>(null)

    const setVolumeFlavorsRef = useRef<(val: number) => void>(null);
    const setVolumeMainFlavorsRef = useRef<(val: number) => void>(null);
    const setVolumeMasterRef = useRef<(val: number) => void>(null);

    const currentDragingRef = useRef<UUID>(null);
    const originSynthLine = useRef<UUID>(null);
    const originalStartPos = useRef<[number, number]>(null);
    const currentDragingOffsetRef = useRef<number>(0);
    const currentDraggingOnPlacedRef = useRef<() => void>(() => 0);
    const currentDraggingIsEmptyRef = useRef<(element: FlavorElement | null, from: number, to?: number) => boolean>(() => false);

    const touchContextMenuRef = useRef<HTMLDivElement>(null);

    const statisticLoopInterval = useRef<NodeJS.Timeout>(null);

    const dishes = useDishes();
    const dishActions = useCurrentDishActions();
    const multiplayer = useMultiplayer();

    const change = useSynthChange();

    const [synthLines, setSynthLines] = dishActions.synthLines;
    const [volumes, setVolumes] = dishActions.volumes;
    const otherUserSelectedRef = useRef<{
        [key: UUID]: UUID[];
    }>({});

    const isTouch = useTouchChecker().isTouch;

    const currentDish = useCurrentDish();
    const customFlavors = useCustomFlavors();

    const tutorials = useTutorials();

    const server = multiplayer.managerRef.current?.getServerCommunication();
    if (server) {

        const getTrack = (uuid: UUID) => {
            return synthLines.find(e => e.uuid == uuid);
        }

        server.onFlavorAdded.add("FlavorSynth", (trackUUID, flavorData) => {
            const track = getTrack(trackUUID);
            if (!track) return;
            track.elements = [...track.elements, flavorData];
            repaintAllElements();
        });

        server.onSynthLineAdded.add("FlavorSynth", (synthLineUUID) => {
            addSynth(synthLineUUID, true);
        });

        server.onSynthLineRemoved.add("FlavorSynth", (synthLineUUID) => {
            setSynthLines(synthLines => synthLines.filter(e => e.uuid != synthLineUUID));
        });

        server.onFlavorsRemoved.add("FlavorSynth", (flavorUUIDs) => {
            for (const track of synthLines) {
                track.elements = track.elements.filter(e => !flavorUUIDs.includes(e.uuid));
            }
            repaintAllElements();
        });

        server.onVolumeChanged.add("FlavorSynth", (newVolume, volumeSlot) => {
            dishActions.volumes[1](volumes => {
                const r = {
                    ...volumes
                };
                r[volumeSlot] = newVolume;
                return r;
            });

            switch (volumeSlot) {
                case "master":
                    setVolumeMasterRef.current?.(newVolume);
                    break;
                case "mainFlavor":
                    setVolumeMainFlavorsRef.current?.(newVolume);
                    break;
                case "flavors":
                    setVolumeFlavorsRef.current?.(newVolume);
                    break;
            }
        });

        server.onFlavorsSelected.add("FlavorSynth", (endpointUUID, flavors) => {
            if (!otherUserSelectedRef.current[endpointUUID]) otherUserSelectedRef.current[endpointUUID] = [];
            otherUserSelectedRef.current[endpointUUID] = [...(new Set([...otherUserSelectedRef.current[endpointUUID], ...flavors]))];
            repaintAllElements();
        });

        server.onSelectOnly.add("FlavorSynth", (endpointUUID, flavorUUID) => {
            otherUserSelectedRef.current[endpointUUID] = [flavorUUID];
            repaintAllElements();
        });

        server.onFlavorsDeselected.add("FlavorSynth", (endpointUUID, flavors) => {
            if (!otherUserSelectedRef.current[endpointUUID]) otherUserSelectedRef.current[endpointUUID] = [];
            otherUserSelectedRef.current[endpointUUID] = otherUserSelectedRef.current[endpointUUID].filter(e => !flavors.includes(e));
            repaintAllElements();
        });

        server.onAllFlavorsDeselected.add("FlavorSynth", (endpointUUID) => {
            otherUserSelectedRef.current[endpointUUID] = [];
            repaintAllElements();
        });

        server.onUpdatedFlavors.add("FlavorSynth", (flavors) => {
            const keyVal: { [key: UUID]: FlavorElement & { trackUUID: UUID } } = {};

            for (const flavor of flavors) {
                keyVal[flavor.uuid] = flavor;
            }

            for (const track of synthLines) {
                track.elements = track.elements
                    .filter(e => !keyVal[e.uuid] || keyVal[e.uuid].trackUUID === track.uuid)
                    .map(e => keyVal[e.uuid] ? {
                        ...e,
                        from: keyVal[e.uuid].from,
                        to: keyVal[e.uuid].to,
                        flavor: keyVal[e.uuid].flavor
                    } : e);

                const allFlavorsForTrack = Object.values(keyVal).filter(e => e.trackUUID === track.uuid);
                const uuidsIncluded = new Set(track.elements.map(e => e.uuid));

                for (const flavor of allFlavorsForTrack) {
                    if (!uuidsIncluded.has(flavor.uuid)) {
                        track.elements.push({
                            uuid: flavor.uuid,
                            from: flavor.from,
                            to: flavor.to,
                            flavor: flavor.flavor
                        });
                        uuidsIncluded.add(flavor.uuid);
                    }
                }
            }
            repaintAllElements();
        });

    }

    withTutorialStarter("editor-opened");

    const onStop = () => {
        setPlaying(false);
        isPlayingRef.current = false;
        stop();
    };

    const addSynth = (uuid: UUID = Utils.uuidv4Exclude(synthLines.map(e => e.uuid)), overwrite: boolean = false) => {
        if (isReadonly && !overwrite) return;

        tutorials.onAction("editor-addedSynthLine");

        const synthLine: FlavorSynthLine = {
            uuid: uuid,
            elements: [],
            muted: false,
            volume: 1,
            solo: false
        };
        setSynthLines(synthLines => [...synthLines, synthLine]);
        ActionHistoryManager.didAction({
            type: "addedTrack",
            track: structuredClone(synthLine)
        });

        repaintAllElements();
        repaintAllTimelines();
        // repaintAll();
        return uuid;
    };

    const deleteSynth = (uuid: string, overwrite: boolean = false) => {
        if (isReadonly && !overwrite) return;
        // if (!currentDish) return;
        // currentDish.data = currentDish.data.filter(e => e.uuid !== uuid);
        const track = synthLines.find(e => e.uuid === uuid);
        if (!track) return;
        ActionHistoryManager.didAction({
            type: "removedTrack",
            track: structuredClone(track)
        });
        setSynthLines(synthLines => synthLines.filter(e => e.uuid !== uuid));
    }

    const deleteElement = (uuid: string, overwrite: boolean = false) => {
        if (isReadonly && !overwrite) return;
        // if (!currentDish) return;
        // currentDish.data = currentDish.data.map(e => {
        //     e.elements = e.elements.filter(e => e.uuid !== uuid);
        //     return e;
        // });
        synthLines.forEach(synthLine => synthLine.elements = synthLine.elements.filter(e => e.uuid !== uuid));
        repaintAllElements();
        // setSynthLines(synthLines => synthLines.map(e => {
        //     return { ...e, elements: e.elements.filter(e => e.uuid !== uuid) };
        // }));
    }

    const onWheel = (e: WheelEvent) => {
        let newSpan = getSpan();

        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();

            const zoomFactor = 1 + (e.deltaY * 0.001);


            let newSpanWidth = (newSpan.to - newSpan.from) * zoomFactor;
            if (newSpanWidth < 10) return;
            if (newSpanWidth > 300) return;
            const zoomInOnSecond = calculateCurrentPosSeconds(e.clientX - getCurrentControlsWidth(isReadonly));
            const distanceLeftSeconds = zoomInOnSecond - newSpan.from;
            const distanceRightSeconds = newSpan.to - zoomInOnSecond;
            const distanceLeftPercent = distanceLeftSeconds / (distanceLeftSeconds + distanceRightSeconds);
            const distanceRightPercent = distanceRightSeconds / (distanceLeftSeconds + distanceRightSeconds);

            const distanceLeft = distanceLeftPercent * newSpanWidth;
            const distanceRight = distanceRightPercent * newSpanWidth;

            newSpan.from = zoomInOnSecond - distanceLeft;
            newSpan.to = zoomInOnSecond + distanceRight;

            newSpan = constrainSpan(newSpan);

            setSpan(widthRef.current, newSpan);

            currentZoomRef.current *= zoomFactor;

            repaintAllTimelines();
            repaintAllElements();
        } else if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            const offsetSeconds = e.deltaY * (window.innerWidth / 1980 * 0.005) * currentZoomRef.current;
            if (newSpan.from + offsetSeconds < 0) {
                const dist = newSpan.to - newSpan.from;
                newSpan.from = 0;
                newSpan.to = Math.round(Math.abs(dist));
            } else {
                newSpan.from += offsetSeconds;
                newSpan.to += offsetSeconds;
            }
            newSpan = constrainSpan(newSpan);
            setSpan(widthRef.current, newSpan);

            repaintAllTimelines();
            repaintAllElements();
        }
    };

    const zoomed = (centerX: number, delta: number) => {
        let newSpan = getSpan();
        const zoomFactor = 1 + (delta * 0.001);
        let newSpanWidth = (newSpan.to - newSpan.from) * zoomFactor;
        const zoomInOnSecond = calculateCurrentPosSeconds(centerX - getCurrentControlsWidth(isReadonly));
        const distanceLeftSeconds = zoomInOnSecond - newSpan.from;
        const distanceRightSeconds = newSpan.to - zoomInOnSecond;
        const distanceLeftPercent = distanceLeftSeconds / (distanceLeftSeconds + distanceRightSeconds);
        const distanceRightPercent = distanceRightSeconds / (distanceLeftSeconds + distanceRightSeconds);

        const distanceLeft = distanceLeftPercent * newSpanWidth;
        const distanceRight = distanceRightPercent * newSpanWidth;

        newSpan.from = zoomInOnSecond - distanceLeft;
        newSpan.to = zoomInOnSecond + distanceRight;

        newSpan = constrainSpan(newSpan);

        setSpan(widthRef.current, newSpan);

        currentZoomRef.current *= zoomFactor;

        repaintAllTimelines();
        repaintAllElements();
    };

    useEffect(() => {
        setSpanFirstTime(widthRef.current, {
            from: 0,
            to: 60
        });
        repaintAllTimelines();
        repaintAllElements();
    }, []);

    const repaintAllTimelines = () => {
        Object.values(timelineRepainters.current).forEach(e => e());
    }

    const repaintAllElements = () => {
        Object.values(elementsRepainters.current).forEach(e => e());
    };

    const setSelectedSynthLine = (uuid: string | null) => {
        focusedSynthRef.current = uuid;
        Object.values(synthSelectionChangeCallbacks.current).forEach(cb => cb());
    }

    const addSynthSelectionChange = (uuid: string, cb: () => void) => {
        synthSelectionChangeCallbacks.current[uuid] = cb;
    }

    // const addSynthRepainter = (uuid: string, sr: () => void) => {
    //     synthRepaintCallbacks.current[uuid] = sr;
    // };

    // const repaintAll = () => {
    //     Object.values(synthRepaintCallbacks.current).forEach(cb => cb());
    // };

    const deleteSelectedElements = () => {
        if (isReadonly) return;
        const selectedUUIDs = selectedElementsRef.current;

        const elementsDeleted = synthLines.map(synthLine => {
            const elements = synthLine.elements.filter(el => selectedUUIDs.indexOf(el.uuid) !== -1);
            if (elements.length == 0) return undefined;
            return {
                trackUUID: synthLine.uuid,
                flavors: structuredClone(elements)
            };
        }).filter(e => !!e);

        if (!elementsDeleted || elementsDeleted.length == 0) return;
        ActionHistoryManager.didAction({
            type: "delete",
            elements: elementsDeleted
        })
        synthLines.forEach(line => {
            line.elements = line.elements.filter(el => selectedUUIDs.indexOf(el.uuid) == -1)
        });
        repaintAllElements();
        // setSynthLines(lines => lines.map(line => {
        //     return { ...line, elements: line.elements.filter(el => selectedUUIDs.indexOf(el.uuid) == -1) };
        // }));
    };

    const addCollisionCheckerCallback = (uuid: string, cb: (fromOffset: number, toOffset: number) => boolean) => {
        collisionCheckerCallbacks.current[uuid] = cb;
    };

    const addOnElementMove = (uuid: string, cb: (secondsOffset: number) => void) => {
        onElementMoveCallbacks.current[uuid] = cb;
    };

    const addOnElementResize = (uuid: string, cb: (fromOffset: number, toOffset: number) => void) => {
        resizeCallbacks.current[uuid] = cb;
    }

    const addCurrentPositionRepainter = (uuid: string, cb: () => void) => {
        currentPosRepainters.current[uuid] = cb;
    };

    const addTimelineRepainter = (uuid: string, cb: () => void) => {
        timelineRepainters.current[uuid] = cb;
    };

    const addElementsRepainter = (uuid: string, cb: () => void) => {
        elementsRepainters.current[uuid] = cb;
    };

    const repaintAllCurrentPositions = () => {
        Object.values(currentPosRepainters.current).forEach(e => e());
    }

    const moveAll = (secondsOffset: number) => {
        Object.values(onElementMoveCallbacks.current).forEach(cb => cb(secondsOffset));
    };

    const resizeAll = (fromOffset: number, toOffset: number) => {
        Object.values(resizeCallbacks.current).forEach(cb => cb(fromOffset, toOffset));
    };


    const canOffsetAll = (fromOffset: number, toOffset: number): boolean => {
        for (const cb of Object.values(collisionCheckerCallbacks.current)) {
            if (!cb(fromOffset, toOffset)) return false;
        }
        return true;
    };

    const undo = () => {
        if (isReadonly) return;
        ActionHistoryManager.undo(setSynthLines);
    };

    const redo = () => {
        if (isReadonly) return;
        ActionHistoryManager.redo(setSynthLines);
    };

    // useEffect(() => {
    //     const render = () => {
    //         repaintAll();
    //         currentFrameId.current = requestAnimationFrame(render);
    //     };
    //     currentFrameId.current = requestAnimationFrame(render);

    //     return () => {
    //         cancelAnimationFrame(currentFrameId.current);
    //     };
    // }, []);

    const musicPlayStart = useRef<number>(0);
    const musicPlayingOffset = useRef<number>(0);
    const playsUntilRef = useRef<number>(0);
    const currentlyStartingRef = useRef<Promise<void> | null>(null);

    const play = async (offset: number = 0) => {
        await Tone.start();

        Tone.getTransport().stop();
        Tone.getTransport().cancel("0:0:0");
        Tone.getTransport().bpm.value = 110;

        const startTime = 0;
        playsUntilRef.current = -1;

        musicPlayStart.current = 0;
        musicPlayingOffset.current = 0;

        const containsSolo = synthLines.filter(e => e.solo).length > 0;
        isSoloPlay.current = containsSolo;
        const elements = synthLines.filter(e => (e.solo && containsSolo) || !containsSolo).filter(e => e.volume != 0).filter(e => !e.muted).flatMap(line => line.elements.map(el => ({ ...el, lineUuid: line.uuid })));
        if (elements.length == 0) return;

        playerRef.current.stop();
        playerRef.current.disposeAll();
        playerRef.current.setVolumes(volumes.current);
        playerRef.current.loadElements(elements, customFlavors);

        if (!containsSolo) {
            mainFlavorsPlayer?.stop();
            mainFlavorsPlayer?.setVolumes(volumes.current);
            await mainFlavorsPlayer?.play(startTime, offset);
        }

        playsUntilRef.current = await playerRef.current.play(startTime, offset);

        setPlaying(true);
        isPlayingRef.current = true;
        currentPlayingOffsetRef.current = Tone.getTransport().seconds;
        repaintAllCurrentPositions();
        startStatisticLoop();
        Tone.getTransport().start(Tone.now(), Tone.Time(offset + cusorPos.current).toBarsBeatsSixteenths());

    };

    const skip = (n: number) => {
        const newPos = currentPositionRef.current + n;

        stop();
        play(newPos);
        // Tone.getTransport().stop();
        // Tone.getTransport().position = Tone.Time(Math.max(Math.max(0, newPos), 0), "s").toBarsBeatsSixteenths();
        // Tone.getTransport().start();

        repaintAllCurrentPositions();
    };

    const stop = () => {
        setPlaying(false);
        isPlayingRef.current = false;
        mainFlavorsPlayer?.stop();
        playerRef.current.stop();
        repaintAllCurrentPositions();
        stopStatisticLoop();
        Tone.getTransport().stop();
    }

    const currentPlayChanged = () => {
        if (!isPlaying) return;
        currentPositionRef.current = Tone.getTransport().seconds;
        repaintAllCurrentPositions();
        if (currentPositionRef.current >= playsUntilRef.current) {
            onStop();
        }
    };

    useEffect(() => {
        const clock = new Tone.Clock(() => {
            if (!isPlaying) return;
            currentPlayChanged();
        }, 100)
        clock.start();

        return () => {
            clock.stop();
            clock.dispose();
        };
    }, [isPlaying]);

    const mainFlavorVolumeChanged = (volume: number) => {
        if (isReadonly) return;
        setVolumes(volumes => {
            playerRef.current.setVolumes(volumes);
            mainFlavorsPlayer?.setVolumes(volumes);
            return { ...volumes, mainFlavor: volume };
        });
        change.changed();

        server?.changeMainFlavorVolume(volume);
    };


    const masterVolumeChanged = (volume: number) => {
        if (isReadonly) return;
        setVolumes(volumes => {
            playerRef.current.setVolumes(volumes);
            mainFlavorsPlayer?.setVolumes(volumes);
            return { ...volumes, master: volume };
        });
        change.changed();

        server?.changeMasterVolume(volume);
    };


    const flavorsVolumeChanged = (volume: number) => {
        if (isReadonly) return;
        setVolumes(volumes => {
            playerRef.current.setVolumes(volumes);
            mainFlavorsPlayer?.setVolumes(volumes);
            return { ...volumes, flavors: volume };
        });
        change.changed();


        server?.changeFlavorVolume(volume);
    };


    const onSkipPrev = () => {
        skip(-SKIP_SIZE);
    };

    const onSkipNext = () => {
        skip(SKIP_SIZE);
    };


    const stopAllDragging = () => {
        Object.values(stopDraggingCallbacks.current).forEach(e => e());
    }

    const addStopDraggingCallback = (uuid: string, cb: () => void) => {
        stopDraggingCallbacks.current[uuid] = cb;
    };

    useEffect(() => {
        const keydown = (e: KeyboardEvent) => {
            if (e.target instanceof Node) {
                const node = (e.target as Node);
                if (node.nodeName.toLowerCase() == "textarea") return;
                if (node.nodeName.toLowerCase() == "input") return;
            }
            if (e.code == "Space") {
                setPlaying(() => {
                    isPlaying ? stop() : (async () => {
                        if (currentlyStartingRef.current) await currentlyStartingRef.current;
                        currentlyStartingRef.current = play();
                    })();
                    return !isPlaying;
                })
                e.preventDefault();
            } else if (e.key == "z" && e.ctrlKey) {
                undo();
                e.preventDefault();
            } else if (e.key == "y" && e.ctrlKey) {
                redo();
                e.preventDefault();
            }

        };

        const mouseRelease = (e: MouseEvent) => {
            if (e.target instanceof HTMLCanvasElement && (e.target as HTMLCanvasElement).classList.contains("trackCanvas")) return;
            currentDragingRef.current = null;
            stopAllDragging();
            repaintAllElements();
        };

        const resized = () => {
            widthRef.current = getCurrentTrackWidth(isReadonly);
            repaintAllElements();
            repaintAllTimelines();
            // repaintAll();
        };

        window.addEventListener("keydown", keydown);
        window.addEventListener("mouseup", mouseRelease);
        window.addEventListener("resize", resized);

        return () => {
            window.removeEventListener("keydown", keydown);
            window.removeEventListener("mouseup", mouseRelease);
            window.removeEventListener("resize", resized);
        };
    }, [synthLines, isReadonly, isPlaying]);


    const startStatisticLoop = () => {
        statisticLoopInterval.current = setInterval(() => {
            updateCurrentPlayingStatistic();
        }, 50);
    };

    const stopStatisticLoop = () => {
        if (statisticLoopInterval.current != null) {
            clearInterval(statisticLoopInterval.current);
            statisticLoopInterval.current = null;
        }
    };

    const updateTotalStatistic = () => {
        if (totalAmountOfFlavorsRef.current) {
            totalAmountOfFlavorsRef.current.textContent = synthLines.map(e => e.elements.length).reduce((a, b) => a + b, 0) + " flavors";
        }
    }

    const updateCurrentPlayingStatistic = () => {
        if (currentPlayingFlavorCountRef.current) {
            const now = Tone.now();
            const currentPos = now - currentPlayingOffsetRef.current;
            currentPlayingFlavorCountRef.current.textContent = synthLines.map(e => e.elements.filter(element => {
                return element.from <= currentPos && currentPos <= element.to;
            }).length).reduce((a, b) => a + b, 0) + " flavors";
        }
    }

    const openContextMenu = (pos: { x: number, y: number }) => {
        if (!touchContextMenuRef.current) return;

        touchContextMenuRef.current.style.setProperty("--top", pos.y + "px");
        touchContextMenuRef.current.style.setProperty("--left", pos.x + "px");
        touchContextMenuRef.current?.classList.add("open");

    };

    useEffect(() => {
        if (!touchContextMenuRef.current) return;

        const touchStartCheckOutside = (e: TouchEvent) => {
            if (e.target instanceof Node && touchContextMenuRef.current?.contains(e.target)) {
                return;
            }

            touchContextMenuRef.current?.classList.remove("open");
        }

        window.addEventListener("touchstart", touchStartCheckOutside);

        return () => {
            window.removeEventListener("touchstart", touchStartCheckOutside);
        }

    }, [touchContextMenuRef.current]);

    const clickedTouchContextMenu = () => {
        touchContextMenuRef.current?.classList.remove("open");
        return {
            delete: () => {
                if (!selectedElementsRef.current) return;
                synthLines.forEach(synthLine => {
                    synthLine.elements = synthLine.elements.filter(e => !selectedElementsRef.current.includes(e.uuid));
                });
                repaintAllElements();
                // setSynthLines(synthLines => synthLines.map(synthLine => {
                //     return {
                //         ...synthLine,
                //         elements: synthLine.elements.filter(e => !selectedElementsRef.current.includes(e.uuid))
                //     }
                // }));
                repaintAllElements();
            }
        }
    }

    const getSynthLineByUUID = (uuid: string) => {
        return synthLines.find(e => e.uuid == uuid) ?? null;
    }

    const updateCurrentPlayingElements = () => {
        if (!isPlayingRef.current) return;
        stop();
        currentlyStartingRef.current = play(currentPositionRef.current);
    };


    // Stop music when leaving
    useEffect(() => {
        return () => {
            stop();
        }
    }, []);

    return <>
        <SynthLinesContext.Provider value={{
            delete: deleteSynth,
            onWheel,
            deleteSelectedElements,
            addCollisionCheckerCallback,
            addOnElementMove,
            addOnElementResize,
            moveAll,
            resizeAll,
            canOffsetAll,
            addCurrentPositionRepainter,
            addTimelineRepainter,
            addElementsRepainter,
            deleteElement,
            repaintAllTimelines,
            repaintAllElements,
            addStopDraggingCallback,
            updateTotalStatistic,
            updateCurrentPlayingStatistic,
            synthLines,
            setSynthLines,
            zoomed,
            getSynthLineByUUID
        }}>
            <FlavorSynthContextMenu.Provider value={{ openContextMenu }}>
                <SynthSelectorContext.Provider value={{ setSelectedSynthLine, focusedSynthRef, selectedElementsRef, addSynthSelectionChange, otherUserSelectedRef }}>
                    <CurrentlyPlayingContext.Provider value={{ updateElements: updateCurrentPlayingElements, isSoloPlay, isPlayingRef, currentPositionRef, cusorPos }}>
                        <CurrentInterPlayerDragContext.Provider value={{ originSynthLine, ref: currentDragingRef, originalStartPos, offsetLeft: currentDragingOffsetRef, onPlaced: currentDraggingOnPlacedRef, isEmptyRef: currentDraggingIsEmptyRef }}>
                            <div className="flavor-synth" data-readonly={isReadonly ? true : undefined}>
                                <div className="lines">
                                    {
                                        Object.values(synthLines).map(e => <SynthLine key={e.uuid} synthLineUUID={e.uuid} widthRef={widthRef}></SynthLine>)
                                    }
                                </div>
                                {
                                    !isReadonly && <button className="addLine" onClick={() => {
                                        const uuid = addSynth();
                                        if (!uuid) return;
                                        server?.addSynthLine(uuid);
                                    }}>
                                        <img src="./imgs/plus/plus.png" alt="+" className="plus" />
                                    </button>
                                }
                                {
                                    isTouch && <PixelDiv className="context-menu-touch" ref={touchContextMenuRef}>
                                        <button className="delete" onClick={() => {
                                            clickedTouchContextMenu().delete();
                                            server?.removeFlavors();
                                        }}>
                                            <img src="./imgs/actionButtons/dishList/delete.png" alt="Delete image" />
                                        </button>
                                    </PixelDiv>
                                }
                            </div>

                            <div className="flavor-synth-controls" data-readonly={isReadonly ? true : undefined}>
                                <div className="statistics">
                                    <div className="activeFlavorsPlaying">
                                        <FlavorStatistic imgSrc="./imgs/stack.png" unit="flavors" value={0} desc="The number of currently playing flavors" ref={currentPlayingFlavorCountRef} />
                                    </div>
                                    <div className="totalFlavorsUsed">
                                        <FlavorStatistic imgSrc="./imgs/total.png" unit="flavors" value={synthLines.map(e => e.elements.length).reduce((a, b) => a + b, 0)} desc="The number of total flavors used" ref={totalAmountOfFlavorsRef} />
                                    </div>
                                </div>

                                <div className="buttons-reversed">
                                    <button className="share" title="Share the Dish" onClick={async () => { await dishes.saveCurrentDish(); gameState.setGameState("createDish-share"); }}>
                                        <img src="./imgs/actionButtons/share.png" alt="Share btn" className="share-action action-btn" />
                                    </button>
                                    {
                                        !multiplayer.isMultiplayer && <button className="multiplayer" title="Open the Dish as a multiplayer" onClick={multiplayer.startMultiplayer}>
                                            <img src="./imgs/actionButtons/multiplayer.png" alt="Multiplayer btn" className="multiplayer-action action-btn" />
                                        </button>
                                    }
                                    {
                                        multiplayer.isMultiplayer && multiplayer.managerRef.current?.isOwner() && <button className="settings" title="Open the multiplayer Settings" onClick={() => multiplayer.setMultiplayerOverlayOpen(true)}>
                                            <img src="./imgs/actionButtons/settings.png" alt="Settings btn" className="settings-action action-btn" />
                                        </button>
                                    }
                                    <button className="save" title="Save Dish" onClick={() => {
                                        server?.save();
                                        if (!multiplayer.managerRef.current?.isOwner()) {
                                            return;
                                        }
                                        dishes.saveCurrentDish();
                                    }}>
                                        <img src="./imgs/actionButtons/save.png" alt="Save btn" className="save-action action-btn" />
                                    </button>
                                    {
                                        multiplayer.isMultiplayer && <button className="chat" title="Open the Chat" onClick={() => multiplayer.setMultiplayerChatOpen(true)}>
                                            <img src="./imgs/actionButtons/chat.png" alt="Chat btn" className="chat-action action-btn" />
                                            <span className="chat-message-count" data-message-count={multiplayer.unreadChatMessageCount}>{multiplayer.unreadChatMessageCount}</span>
                                        </button>
                                    }
                                    {
                                        isReadonly &&
                                        <button className="fork" title="Fork the dish" onClick={dishes.forkCurrentDish}>
                                            <img src="./imgs/actionButtons/fork.png" alt="Fork btn" className="fork-action action-btn" />
                                        </button>
                                    }
                                </div>

                                <div className="controls">
                                    <button className="skip-prev" title="Skip 1s back" onClick={onSkipPrev}>
                                        <img src="./imgs/actionButtons/prev.png" alt="previous btn" className="action-btn prev-img" />
                                    </button>
                                    <button className="play" onClick={() => {
                                        isPlaying
                                            ?
                                            stop()
                                            :
                                            (async () => {
                                                if (currentlyStartingRef.current) await currentlyStartingRef.current;
                                                currentlyStartingRef.current = play();
                                            })();
                                    }}>{
                                            isPlaying
                                                ?
                                                <img src="./imgs/actionButtons/pause.png" alt="pause btn" className="action-btn pause-ptn" />
                                                :
                                                <img src="./imgs/actionButtons/play.png" alt="play btn" className="action-btn play-ptn" />
                                        }
                                    </button>
                                    <button className="skip-next" title="Skip 1s forward" onClick={onSkipNext}>
                                        <img src="./imgs/actionButtons/next.png" alt="next btn" className="action-btn next-img" />
                                    </button>
                                </div>
                                <PixelDiv className="volumes">
                                    <div className="volume">
                                        <ControlKnob classNames="flavors" label="Flavors" setVolumeRef={setVolumeFlavorsRef} startVal={currentDish?.volumes.flavors ?? 100} onValueChanged={flavorsVolumeChanged}></ControlKnob>
                                    </div>
                                    <div className="mainFlavorVolume">
                                        <ControlKnob classNames="main-flavors" label="Main Flavor" setVolumeRef={setVolumeMainFlavorsRef} startVal={currentDish?.volumes.mainFlavor ?? 100} onValueChanged={mainFlavorVolumeChanged}></ControlKnob>
                                    </div>
                                    <div className="masterVolume">
                                        <ControlKnob classNames="master-flavors" label="Master" setVolumeRef={setVolumeMasterRef} startVal={currentDish?.volumes.master ?? 100} onValueChanged={masterVolumeChanged}></ControlKnob>
                                    </div>
                                </PixelDiv>
                                <div className="buttons">
                                    <button className="share" title="Share the Dish" onClick={() => gameState.setGameState("createDish-share")}>
                                        <img src="./imgs/actionButtons/share.png" alt="Share btn" className="share-action action-btn" />
                                    </button>
                                    {
                                        !multiplayer.isMultiplayer && <button className="multiplayer" title="Open the Dish as a multiplayer" onClick={multiplayer.startMultiplayer}>
                                            <img src="./imgs/actionButtons/multiplayer.png" alt="Multiplayer btn" className="multiplayer-action action-btn" />
                                        </button>
                                    }
                                    {
                                        multiplayer.isMultiplayer && multiplayer.managerRef.current?.isOwner() && <button className="settings" title="Open the multiplayer Settings" onClick={() => multiplayer.setMultiplayerOverlayOpen(true)}>
                                            <img src="./imgs/actionButtons/settings.png" alt="Settings btn" className="settings-action action-btn" />
                                        </button>
                                    }
                                    <button className="save" title="Save Dish" onClick={dishes.saveCurrentDish}>
                                        <img src="./imgs/actionButtons/save.png" alt="Save btn" className="save-action action-btn" />
                                    </button>
                                    {
                                        multiplayer.isMultiplayer && <button className="chat" title="Open the Chat" onClick={() => multiplayer.setMultiplayerChatOpen(true)}>
                                            <img src="./imgs/actionButtons/chat.png" alt="Chat btn" className="chat-action action-btn" />
                                            <span className="chat-message-count" data-message-count={multiplayer.unreadChatMessageCount}>{multiplayer.unreadChatMessageCount}</span>
                                        </button>
                                    }
                                    {
                                        isReadonly &&
                                        <button className="fork" title="Fork the dish" onClick={dishes.forkCurrentDish}>
                                            <img src="./imgs/actionButtons/fork.png" alt="Fork btn" className="fork-action action-btn" />
                                        </button>
                                    }
                                </div>
                            </div>

                        </CurrentInterPlayerDragContext.Provider>
                    </CurrentlyPlayingContext.Provider>
                </SynthSelectorContext.Provider>
            </FlavorSynthContextMenu.Provider>
        </SynthLinesContext.Provider>
    </>
}

export type FlavorSynthLine = {
    uuid: UUID;
    elements: FlavorElement[];
    volume: number;
    muted: boolean;
    solo: boolean;
}

export type CurrentSpan = {
    from: number;
    to: number;
}

function getCurrentTrackWidth(isReadonly: boolean) {
    const width = window.innerWidth;

    const listWidth = (!isReadonly) ? Math.min(Math.max(width * 0.2, 100), 250) : 40;

    let controlsWidth = (window.innerWidth - listWidth) * 0.1;
    if (controlsWidth > 100) controlsWidth = 100;
    if (controlsWidth < 50) controlsWidth = 50;
    let restWidth = window.innerWidth - listWidth - controlsWidth - 20; // - padding+margin = 20
    return restWidth;
}

function getCurrentControlsWidth(isReadonly: boolean) {
    const width = window.innerWidth;
    const listWidth = (!isReadonly) ? Math.min(Math.max(width * 0.2, 100), 250) : 40;

    let controlsWidth = (window.innerWidth - listWidth) * 0.1;
    if (controlsWidth > 100) controlsWidth = 100;
    if (controlsWidth < 50) controlsWidth = 50;
    return controlsWidth;
}
