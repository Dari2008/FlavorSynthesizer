import { Activity, useEffect, useRef, useState } from "react";
import { FLAVORS, intitializeAllAudios } from "../audio/Flavors";
import CurrentMainThemeSelector from "../components/currentMainTheme/CurrentMainThemeSelector";
import FlavorDragNDropList from "../components/flavor-dragn-drop-list/FlavorDragNDropList";
import FlavorSynth, { type FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
import "./App.scss";
import { MAIN_FLAVOR_COLOR, type MainFlavor } from "../@types/Flavors";
import MainFlavorSelectionDialog from "../components/MainFlavorSelectionDialog/MainFlavorSelectionDialog";
import ShareDialog from "../components/shareDialog/ShareDialog";
import OpenShareDialog, { type OpenData } from "../components/openShareDialog/OpenShareDialog";
import { ToastContainer } from "react-toastify";
import { useConfirm } from "../components/dialogs/ConfirmDialogContext";
import type { APIResponse, Digit, OpenShareResponse } from "../@types/Api";
import { BASE_URL } from "../utils/Statics";
import Utils from "../utils/Utils";
import { createElementForFlavor } from "../components/FlavorUtils";
import InitialMenu, { type DownloadProgress } from "../components/initialMenu/InitialMenu";
import type { Dish, User } from "../@types/User";
import DishList from "../components/dishList/DishList";
import { initCurrentPosImages } from "../components/flavorSynth/CurrentPosimageInit";
import { UserContext } from "../contexts/UserContext";
import { DishesContext } from "../contexts/DishesContext";
import { useTitle } from "../contexts/TitleContext";
import { CurrentDishIndexContext } from "../contexts/CurrentDish";
import useJsObjectHook, { useJsRefObjectHook } from "../hooks/JsObjectHook";
import { GameStateContext, type GameState } from "../contexts/GameStateContext";
import { MainFlavorContext } from "../contexts/MainFlavorContext";
import DishManager from "../components/dishManager/DishManager";

export default function App() {
    const reselectMainFlavorRef = useRef<() => void>(() => 0);
    const isFirstTimeOpen = useRef<boolean>(true);
    // const synthLinesWrapped = useState<FlavorSynthLine[]>([]);
    const [userLoggedIn, setUserLoggedIn] = useState<User | null>(getLoggedInUser());
    const [hasDownloadedData, setHasDD] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgres] = useState<DownloadProgress>({ max: 0, val: 0, maxSize: 0, size: 0, mbSec: 0 });
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);
    const currentDishTitleRef = useRef<HTMLInputElement>(null);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [currentDishIndex, setCurrentDishIndex] = useState<number>(-1);

    const [gameState, _setGameState] = useState<GameState>("mainMenu");
    const [oldGameStates, setOldGameStates] = useState<GameState[]>(["mainMenu"]);

    const currentDish = dishes.at(currentDishIndex);

    const [currentDishName, setCurrentDishName] = useJsRefObjectHook<string, Dish>(generateNewDishTitle(), currentDish, "name");
    const [mainFlavor, setMF] = useJsObjectHook<MainFlavor, Dish>("Savory", currentDish, "mainFlavor");

    const { setTitle, title } = useTitle();

    const setCurrentDishTitleToElement = (title: string) => {
        if (currentDishTitleRef.current) {
            currentDishTitleRef.current.value = title;
        }
    }

    function setGameState(state: GameState) {
        if (state == "mainMenu") {
            setOldGameStates([]);
        } else {
            setOldGameStates([...oldGameStates, gameState]);
        }
        _setGameState(state);
    }

    useEffect(() => {
        if (userLoggedIn) {
            (async () => {
                const localDishes = JSON.parse(localStorage.getItem("dishes") ?? "null") as Dish[] | null;
                let integrateDishes = null;
                if (localDishes != null) {
                    integrateDishes = await confirm("Do you want to upload all your local Dishes to the server?", "noYes");
                }
                let dishes = null;
                if (integrateDishes && localDishes) {
                    dishes = await DishManager.loadDishesFromServer(userLoggedIn, localDishes);
                } else {
                    dishes = await DishManager.loadDishesFromServer(userLoggedIn);
                }
                if (!dishes) return;
                setDishes(dishes);
            })();
        } else {
            // TODO: Load dishes from local storage
            const localDishes = JSON.parse(localStorage.getItem("dishes") ?? "null") as Dish[] | null;
            console.log(localDishes);
            if (localDishes) {
                setDishes(localDishes);
            }
        }
    }, []);

    const saveDishes = () => {
        if (userLoggedIn) {

        } else {
            const jsonData = JSON.stringify(dishes.filter(e => !e.temporary));
            localStorage.setItem("dishes", jsonData);
        }

        setTitle(title.replaceAll("*", ""));
    }

    function generateNewDishTitle() {
        const def = "Unnamed";
        let curr = def;
        let index = 0;
        const names = dishes.map(e => e.name);
        while (names.includes(curr)) {
            curr = def + " " + (index + 1);
            index++;
        }
        return curr;
    }

    function createNewActiveDish() {
        const newDish: Dish = {
            aiImage: "",
            data: [],
            mainFlavor: "Bitter",
            name: generateNewDishTitle(),
            publishState: "private",
            dishCreationDate: Date.now(),
            createdBy: userLoggedIn?.displayName ?? "Unknown",
            share: undefined,
            temporary: undefined,
            uuid: Utils.uuidv4Exclude(dishes.map(e => e.uuid))
        };
        dishes.push(newDish);
        const index = dishes.indexOf(newDish);
        setDishes([...dishes]);
        // synthLinesWrapped[1](newDish.data);
        setCurrentDishName(newDish.name)
        setCurrentDishTitleToElement(newDish.name);
        setCurrentDishIndex(index);
    }

    useEffect(() => {
        checkIfDataDownloaded().then(async e => {
            if (e) await initializeAllDownloadedResources();
            setHasDD(e);
            setHasLoaded(true);
        })
    }, []);
    const confirm = useConfirm().confirm;

    const setMainFlavor = (flavor: MainFlavor) => {
        isFirstTimeOpen.current = false;
        setMF(flavor);
        document.body.setAttribute("data-flavor", flavor);
        const st = document.body.style;
        st.setProperty("--main-color", MAIN_FLAVOR_COLOR[flavor][0]);
        st.setProperty("--secondary-color", MAIN_FLAVOR_COLOR[flavor][1]);
        st.setProperty("--main-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][0]));
        st.setProperty("--secondary-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][1]));
    };

    const openSelectMainFlavor = () => {
        setGameState("createDish-mainFlavor");
        setTimeout(() => {
            reselectMainFlavorRef.current();
        }, 300);
    };

    const openOpenShare = () => {
        setGameState("openShared");
    }

    const initializeAllDownloadedResources = async () => {
        await intitializeAllAudios();
        await initCurrentPosImages();
    };

    const open = async (data: OpenData) => {
        if (data.type == "url") {
            const params = (new URL(data.url)).searchParams;
            const code = params.get("code") ?? -1;
            if (code == -1) return;
            if (!code) return;
            data = {
                type: "code",
                code: code.split("").map(e => parseInt(e) as Digit)
            };
        }

        const response = await (await fetch(BASE_URL + "/share/open.php", {
            method: "POST",
            body: JSON.stringify({
                ...data
            })
        })).json() as APIResponse<OpenShareResponse>;

        if (response.status == "error") {
            Utils.error("Couldn't open dish");
            return;
        }

        setMainFlavor(response.mainFlavor);
        const dish: Dish = {
            data: response.tracks.map(e => {
                return {
                    uuid: Utils.uuidv4(),
                    muted: e.muted,
                    solo: e.solo,
                    volume: e.volume,
                    elements: e.elements.map(e => {
                        return createElementForFlavor(e.flavor, e.from, e.to);
                    })
                }
            }),
            ...response,
            temporary: true
        }
        const newD = [...dishes, dish];
        setDishes(newD);
        setCurrentDishIndex(newD.length - 1);
        setGameState("createDish-create-viewonly");
    };

    useEffect(() => {
        open({ type: "url", url: location.href });
    }, [location.href]);

    const goBack = () => {
        setGameState(oldGameStates.pop() ?? "mainMenu");
        setOldGameStates(oldGameStates);
    };

    return <>
        <MainFlavorContext.Provider value={{ mainFlavor, setMainFlavor }}>
            <GameStateContext.Provider value={{ gameState, setGameState, goBack, createNewActiveDish }}>
                <CurrentDishIndexContext.Provider value={{ val: currentDishIndex, setIndex: setCurrentDishIndex }}>
                    <DishesContext.Provider value={{ dishes, setDishes, saveDishes }}>
                        <UserContext.Provider value={{ user: userLoggedIn, setUser: setUserLoggedIn, saveDishes: saveDishes }}>
                            <ToastContainer position="bottom-right" draggable newestOnTop theme="dark" />

                            <Activity mode={gameState == "mainMenu" ? "visible" : "hidden"}>
                                <InitialMenu hasLoaded={hasLoaded} downloadFinished={async () => { await initializeAllDownloadedResources(); setHasDD(true); }} hasDownloadedAssets={hasDownloadedData} downloadWrapper={[downloadProgress, setDownloadProgres]}></InitialMenu>
                            </Activity>

                            <Activity mode={gameState == "createDish-mainFlavor" ? "visible" : "hidden"}>
                                <MainFlavorSelectionDialog reselectMainFlavorRef={reselectMainFlavorRef}></MainFlavorSelectionDialog>
                            </Activity>

                            <Activity mode={gameState == "createDish-create" || gameState == "createDish-create-viewonly" ? "visible" : "hidden"}>
                                <div className="title">
                                    <div className="bg-wrapper">
                                        <div className="img-wrapper">
                                            <img src="./imgs/nameTag/name_tag_left.png" className="bg-image-start"></img>
                                            <div className="bg-image"></div>
                                            <img src="./imgs/nameTag/name_tag_right.png" className="bg-image-end"></img>
                                        </div>
                                        <input className="title-input" maxLength={20} type="text" onInput={() => {
                                            if (currentDishTitleRef.current) {
                                                setCurrentDishName(currentDishTitleRef.current.value || "Unnamed");
                                            }
                                        }} ref={(e) => { currentDishTitleRef.current = e; e && (e.value = currentDishName.current) }}></input>
                                    </div>
                                </div>

                                <CurrentMainThemeSelector />
                                <FlavorSynth />

                                <button className="close" onClick={() => setGameState("mainMenu")}>x</button>
                            </Activity>

                            <Activity mode={gameState == "createDish-share" ? "visible" : "hidden"}>
                                <ShareDialog></ShareDialog>
                            </Activity>

                            <Activity mode={(gameState == "createDish-create" || gameState == "openShared" || gameState == "createDish-share") ? "visible" : "hidden"}>
                                <FlavorDragNDropList hasDownloaded={hasDownloadedData}></FlavorDragNDropList>
                            </Activity>

                            <Activity mode={gameState == "openShared" ? "visible" : "hidden"}>
                                <OpenShareDialog open={open}></OpenShareDialog>
                            </Activity>

                            <Activity mode={gameState == "dishList" ? "visible" : "hidden"}>
                                <DishList />
                            </Activity>

                            {/* {

            !hasSelectedNewMainFlavor && 
        } */}
                            {/* {
            hasSelectedNewMainFlavor &&
            <>
            </>
        } */}

                        </UserContext.Provider>
                    </DishesContext.Provider>
                </CurrentDishIndexContext.Provider>
            </GameStateContext.Provider>
        </MainFlavorContext.Provider>
    </>;
}

function toRGB(hex: string): string {
    // Remove leading #
    const normalized = hex.replace(/^#/, "");

    if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
        throw new Error("Invalid hex color format");
    }

    // Expand 3-digit hex to 6-digit hex
    const fullHex =
        normalized.length === 3
            ? normalized
                .split("")
                .map((c) => c + c)
                .join("")
            : normalized;

    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);

    return `${r}, ${g}, ${b}`;
}


async function checkIfDataDownloaded() {
    const dbs = await indexedDB.databases();
    return dbs.length == 2;
}

function getLoggedInUser(): User | null {
    const user = localStorage.getItem("user") as User | null;
    const allowedDate = localStorage.getItem("allowedUntil");
    if (!allowedDate) return null;
    if (!user) return null;
    const parsedUntil = parseInt(allowedDate) * 1000;
    if (Date.now() > parsedUntil) return null;
    return user;
}

export type ReturnPointWhenCancel = "flavorSynth" | "dishList" | "menu";