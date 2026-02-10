import { Activity, useEffect, useRef, useState } from "react";
import { intitializeAllAudios } from "../audio/Flavors";
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
import type { Dish, DishVolumes, LocalDish, User } from "../@types/User";
import DishList from "../components/dishList/DishList";
import { initCurrentPosImages } from "../components/flavorSynth/CurrentPosimageInit";
import { UserContext } from "../contexts/UserContext";
import { DishesContext } from "../contexts/DishesContext";
import { useTitle } from "../contexts/TitleContext";
import { CurrentDishIndexContext } from "../contexts/CurrentDish";
import useJsObjectHook, { useJsObjectHookForArray, useJsRefObjectHook } from "../hooks/JsObjectHook";
import { GameStateContext, type GameState } from "../contexts/GameStateContext";
import { MainFlavorContext } from "../contexts/MainFlavorContext";
import DishManager from "../components/dishManager/DishManager";
import withDebounce from "../hooks/Debounce";
import { CurrentDishActionsContext } from "../contexts/DishActions";
import { LoadingAnimationContext } from "../contexts/LoadingAnimationContext";
import Loading from "../components/loading/Loading";
import Download from "../components/download/Download";
import { initLoadingAnimation } from "../components/loading/LoadingAnimationDownloads";

export default function App() {
    // const synthLinesWrapped = useState<FlavorSynthLine[]>([]);

    const savedMessageRef = useRef<HTMLDivElement>(null);

    const [userLoggedIn, setUserLoggedIn] = useState<User | null>(getLoggedInUser());
    const [hasDownloadedData, setHasDD] = useState<boolean>(false);
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);
    const currentDishTitleRef = useRef<HTMLInputElement>(null);
    const [dishes, setDishes] = useState<(Dish | LocalDish)[]>([]);
    const [currentDishIndex, setCurrentDishIndex] = useState<number>(-1);

    const [gameState, _setGameState] = useState<GameState>("mainMenu");
    const [oldGameStates, setOldGameStates] = useState<GameState[]>(["mainMenu"]);

    const currentDish = dishes.at(currentDishIndex);

    const [currentDishName, setCurrentDishName] = useJsRefObjectHook<string, Dish | LocalDish>(generateNewDishTitle(), currentDish, "name");
    const [mainFlavor, setMF] = useJsObjectHook<MainFlavor, Dish | LocalDish>("Savory", currentDish, "mainFlavor");

    const [volumes, setVolumes] = useJsRefObjectHook<DishVolumes, Dish | LocalDish>(currentDish?.volumes ?? ({
        flavors: 100,
        mainFlavor: 100,
        master: 100
    }), currentDish, "volumes");

    const [synthLines, setSynthLines, addSynthLine] = useJsObjectHookForArray<FlavorSynthLine, Dish | LocalDish>([], currentDish, "data");

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
                startLoading("loadingDishes");
                const localDishes = JSON.parse(localStorage.getItem("dishes") ?? "null") as LocalDish[] | null;
                const v = localStorage.getItem("overwriteLocalDishesToServer");
                let integrateDishes = v == null ? null : v == "true";
                if (integrateDishes == null && localDishes != null) {
                    integrateDishes = await confirm("Do you want to upload all your local Dishes to the server?", "noYes");
                    localStorage.setItem("overwriteLocalDishesToServer", integrateDishes + "");
                }
                let dishes = null;
                if (integrateDishes && localDishes) {
                    dishes = await DishManager.loadDishesFromServer(userLoggedIn, localDishes);
                } else {
                    dishes = await DishManager.loadDishesFromServer(userLoggedIn);
                }
                if (!dishes) return;
                localStorage.removeItem("dishes");
                localStorage.removeItem("overwriteLocalDishesToServer");
                setDishes(dishes);
                stopLoading("loadingDishes");
            })();
        } else {
            const localDishes = JSON.parse(localStorage.getItem("dishes") ?? "null") as LocalDish[] | null;
            if (localDishes) {
                setDishes(localDishes);
            }
        }

        const saveDishAutomatically = async () => {
            if (!currentDish) return;
            await saveCurrentDish();
            setTimeout(saveDishAutomatically, 2 * 60 * 1000);
        };

        setTimeout(saveDishAutomatically, 2 * 60 * 1000);

    }, []);

    const saveCurrentDish = async () => {
        if (userLoggedIn) {
            if (!currentDish) {
                Utils.error("Can't save this dish");
                return;
            }
            await DishManager.updateEntireDish(userLoggedIn, currentDish as Dish);
        } else {
            const jsonData = JSON.stringify(dishes.filter(e => !(e as any).temporary));
            localStorage.setItem("dishes", jsonData);
        }

        setTitle(title.replaceAll("*", ""));
        if (savedMessageRef.current) {
            savedMessageRef.current?.setAttribute("data-open", "");
            setTimeout(() => {
                savedMessageRef.current?.removeAttribute("data-open");
            }, 2000);
        }
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

    function createNewActiveDish(newDish: Dish | LocalDish = {
        aiImage: "",
        data: [],
        mainFlavor: "Bitter",
        name: generateNewDishTitle(),
        publishState: "private",
        dishCreationDate: Date.now(),
        createdBy: userLoggedIn?.displayName ?? "Unknown",
        share: undefined,
        temporary: undefined,
        uuid: Utils.uuidv4Exclude(dishes.map(e => e.uuid)),
        volumes: {
            flavors: 100,
            mainFlavor: 100,
            master: 100
        }
    }, setCurrent: boolean = true, indexToInsertAt?: number) {
        if (indexToInsertAt != undefined) {
            dishes.splice(indexToInsertAt, 0, newDish);
        } else {
            dishes.push(newDish);
        }
        setDishes([...dishes]);
        const index = dishes.indexOf(newDish);
        if (setCurrent) {
            setCurrentDishName(newDish.name)
            setCurrentDishTitleToElement(newDish.name);
            setCurrentDishIndex(index);
            setSynthLines(newDish.data);
        }
        addedNewDish(newDish, index);
    }

    async function addedNewDish(dish: Dish | LocalDish, index: number) {
        if (!userLoggedIn) return;
        const changedUUID = await DishManager.addDish(userLoggedIn, dish);
        if (!changedUUID) return;
        if (typeof changedUUID == "string") {
            const d = dishes.at(index);
            if (!d) return;
            d.uuid = changedUUID;
        }
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
        setMF(flavor);
        document.body.setAttribute("data-flavor", flavor);
        const st = document.body.style;
        st.setProperty("--main-color", MAIN_FLAVOR_COLOR[flavor][0]);
        st.setProperty("--secondary-color", MAIN_FLAVOR_COLOR[flavor][1]);
        st.setProperty("--main-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][0]));
        st.setProperty("--secondary-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][1]));
    };

    const initializeAllDownloadedResources = async () => {
        startLoading("loadingAll");
        await initLoadingAnimation();
        await intitializeAllAudios();
        await initCurrentPosImages();
        stopLoading("loadingAll");
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

        startLoading("openSharedDish");
        const response = await (await fetch(BASE_URL + "/share/open.php", {
            method: "POST",
            body: JSON.stringify({
                ...data
            })
        })).json() as APIResponse<OpenShareResponse>;

        stopLoading("openSharedDish");
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

    const openDishFromObj = (dish: Dish | LocalDish) => {
        const index = dishes.indexOf(dish as any);
        if (index == -1) return;
        setCurrentDishIndex(index);

        setCurrentDishTitleToElement(dish.name);
        setCurrentDishName(dish.name);
        setMainFlavor(dish.mainFlavor);

        setVolumes(dish.volumes);
        setSynthLines(dish.data);
    }

    useEffect(() => {
        open({ type: "url", url: location.href });
    }, [location.href]);

    const goBack = () => {
        console.log("NewCurr", oldGameStates);
        setGameState(oldGameStates.pop() ?? "mainMenu");
        setOldGameStates(oldGameStates);
    };

    const deleteDisheWithUUID = async (uuid: string) => {
        const newDishes = dishes.filter(e => e.uuid !== uuid);
        if (userLoggedIn) {
            await DishManager.deleteDish(userLoggedIn, uuid);
        } else {
            localStorage.setItem("dishes", JSON.stringify(newDishes));
        }
        setDishes(newDishes);
        Utils.success("Deleted Dish");
    };

    let currentlyLoading: string[] = [];
    let oldGameState: GameState = "mainMenu";

    const startLoading = (key?: string) => {
        if (currentlyLoading.length == 0 && oldGameStates[oldGameStates.length - 1] != "loading") {
            oldGameState = gameState;
            _setGameState("loading");
        }
        if (key) currentlyLoading.push(key);
        console.log("Loading... ", key);
    };
    const stopLoading = (key?: string) => {
        if (key) currentlyLoading = currentlyLoading.filter(e => e !== key);
        if (currentlyLoading.length == 0) {
            setOldGameStates(oldGameStates.filter(e => e !== "loading"));
            _setGameState(oldGameState);
        }
        console.log("Finished loading... ", key, oldGameStates, gameState);
    };

    return <>
        <LoadingAnimationContext.Provider value={{ startLoading, stopLoading }}>
            <CurrentDishActionsContext value={{ synthLines: [synthLines, setSynthLines, addSynthLine], volumes: [volumes, setVolumes] }}>
                <MainFlavorContext.Provider value={{ mainFlavor, setMainFlavor }}>
                    <GameStateContext.Provider value={{ gameState, setGameState, goBack, createNewActiveDish }}>
                        <CurrentDishIndexContext.Provider value={{ val: currentDishIndex, setIndex: setCurrentDishIndex, openDishFromObj }}>
                            <DishesContext.Provider value={{ dishes, setDishes, saveCurrentDish: withDebounce(saveCurrentDish, 2000), deleteDisheWithUUID }}>
                                <UserContext.Provider value={{ user: userLoggedIn, setUser: setUserLoggedIn }}>
                                    <ToastContainer position="bottom-right" draggable newestOnTop theme="dark" />

                                    <Activity mode={gameState == "mainMenu" ? "visible" : "hidden"}>
                                        <InitialMenu></InitialMenu>
                                    </Activity>

                                    <Activity mode={!hasDownloadedData || currentlyLoading.includes("downloadData") ? "visible" : "hidden"}>
                                        <Download hasLoaded={hasLoaded} downloadFinished={async () => { await initializeAllDownloadedResources(); setHasDD(true); }} hasDownloadedAssets={hasDownloadedData}></Download>
                                    </Activity>

                                    <Activity mode={gameState == "createDish-mainFlavor" ? "visible" : "hidden"}>
                                        <MainFlavorSelectionDialog></MainFlavorSelectionDialog>
                                    </Activity>

                                    {
                                        (gameState == "createDish-create" || gameState == "createDish-create-viewonly") && <>
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
                                        </>
                                    }

                                    {/* <Activity mode={gameState == "createDish-create" || gameState == "createDish-create-viewonly" ? "visible" : "hidden"}>
                            </Activity> */}

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

                                    {gameState == "loading" && <Loading />}


                                    <div className="save-message" ref={savedMessageRef}>
                                        Saved Current Dish
                                    </div>

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
            </CurrentDishActionsContext>
        </LoadingAnimationContext.Provider>
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
    return dbs.length == 4;
}

function getLoggedInUser(): User | null {
    const user = localStorage.getItem("user") as string | null;
    const allowedDate = localStorage.getItem("allowedUntil");
    if (!allowedDate) return null;
    if (!user) return null;
    const parsedUntil = parseInt(allowedDate) * 1000;
    if (Date.now() > parsedUntil) return null;
    return JSON.parse(user);
}

export type ReturnPointWhenCancel = "flavorSynth" | "dishList" | "menu";