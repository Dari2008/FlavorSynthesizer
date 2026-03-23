import { Activity, useEffect, useRef, useState } from "react";
import { intitializeAllAudios } from "../audio/Flavors";
import CurrentMainThemeSelector from "../components/currentMainTheme/CurrentMainThemeSelector";
import FlavorDragNDropList from "../components/flavor-dragn-drop-list/FlavorDragNDropList";
import FlavorSynth, { type FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
import "./App.scss";
import { MAIN_FLAVOR_COLOR, type Flavor, type MainFlavor } from "../@types/Flavors";
import MainFlavorSelectionDialog from "../components/MainFlavorSelectionDialog/MainFlavorSelectionDialog";
import ShareDialog from "../components/shareDialog/ShareDialog";
import OpenShareDialog, { type OpenData } from "../components/openShareDialog/OpenShareDialog";
import { ToastContainer } from "react-toastify";
import { useConfirm } from "../components/dialogs/ConfirmDialogContext";
import { type ShareDigits, type Digit, type OpenShareResponse, type APIResponse } from "../@types/Api";
import { BASE_URL, DATE_FORMAT, URL_EXTENSION } from "../utils/Statics";
import Utils from "../utils/Utils";
import { createElementForFlavor } from "../components/FlavorUtils";
import InitialMenu from "../components/initialMenu/InitialMenu";
import type { Dish, DishVolumes, LocalDish, MultiplayerServerDish, RawLocalDish, User } from "../@types/User";
import DishList from "../components/dishList/DishList";
import { initCurrentPosImages } from "../components/flavorSynth/CurrentPosimageInit";
import { UserContext } from "../contexts/UserContext";
import { DishesContext } from "../contexts/DishesContext";
import { useTitle } from "../contexts/TitleContext";
import { CurrentDishIndexContext } from "../contexts/CurrentDish";
import { GameStateContext, type GameState } from "../contexts/GameStateContext";
import { MainFlavorContext } from "../contexts/MainFlavorContext";
import DishManager from "../components/dishManager/DishManager";
import withDebounce from "../hooks/Debounce";
import { CurrentDishActionsContext } from "../contexts/DishActions";
import { LoadingAnimationContext } from "../contexts/LoadingAnimationContext";
import Loading from "../components/loading/Loading";
import Download from "../components/download/Download";
import { initLoadingAnimation } from "../components/loading/LoadingAnimationDownloads";
import { DOWNLOAD_GROUP_COUNT, DOWNLOAD_PROGRESS_KEY } from "../download/DownloadManager";
import { SynthChangeContext } from "../contexts/SynthChangeContext";
import { Network } from "../utils/Network";
import { TouchCheckerContext } from "../contexts/TouchCheckerContext";
import { CurrentDraggingElementTouch } from "../contexts/CurrentDraggingElementTouch";
import { initRotateNotice } from "../components/errorInfoComponents/rotateDevice/RotateDeviceNoticeDownload";
import RotateDeviceNotice from "../components/errorInfoComponents/rotateDevice/RotateDeviceNotice";
import DeviceNotSupported from "../components/errorInfoComponents/notSupported/NotSupportedNotice";
import Restaurant from "../components/restaurant/Restaurant";
import dayjs from "dayjs";
import Tutorials, { type TutorialAction } from "../components/tutorials/Tutorials";
import { MultiplayerServer, ServerCommunication, type PlayerJoined } from "../serverCommunication/ServerCommunication";
import { MultiplayerContext } from "../contexts/MultiplayerContext";
import MultiplayerSettingsOverlay from "../components/multiplayerSettingsOverlay/MultiplayerSettingsOverlay";
import { useInput } from "../components/dialogs/InputDialogContext";
import MultiplayerChatOverlay, { type ChatMessage } from "../components/multiplayerChatOverlay/MultiplayerChatOverlay";
import { loadAllCustomFlavorsAsMusicPlayer, type CustomFlavor } from "../components/addCustomFlavor/CustomFlavorManager";
import { CustomFlavors } from "../contexts/CustomFlavors";
import { CustomFlavorMusic } from "../audio/FlavorMusic";
import CustomFlavorMenu from "../components/customFlavorMenu/CustomFlavorMenu";
import CustomFlavorServerManager from "../components/customFlavorMenu/CustomFlavorServerManager";
import { hasResource } from "../components/ResourceSaver";

export default function App() {
    // const synthLinesWrapped = useState<FlavorSynthLine[]>([]);

    const savedMessageRef = useRef<HTMLDivElement>(null);

    const [userLoggedIn, setUserLoggedIn] = useState<User | null>(getLoggedInUser());
    const [hasDownloadedData, setHasDD] = useState<boolean>(false);
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);
    const currentDishTitleRef = useRef<HTMLInputElement>(null);
    const [dishes, setDishes] = useState<(Dish | LocalDish)[]>([]);
    const [currentDishIndex, setCurrentDishIndex] = useState<number>(-1);

    const [multiplayerManager, setMultiplayerManager] = useState<MultiplayerServer | null>(null);
    const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
    const [playersJoined, setPlayersJoined] = useState<PlayerJoined[]>([]);
    const [multiplayerCode, setMultiplayerCode] = useState<ShareDigits>([0, 0, 0, 0, 0, 0]);
    const [isMultiplayerOverlayOpen, setMultiplayerOverlayOpen] = useState<boolean>(false);
    const [isMultiplayerChatOpen, setMultiplayerChatOpen] = useState<boolean>(false);
    const [unreadChatMessageCount, setUnreadChatMessageCount] = useState<number>(1);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [multiplayerName, setMultiplayerName] = useState<string | null>(null);
    const [isMultiplayerMuted, setMultiplayerMuted] = useState<boolean>(false);

    const hasLoadedUserInfoOnce = useRef<boolean>(false);

    const server = multiplayerManager?.getServerCommunication();

    const [gameState, _setGameState] = useState<GameState>("mainMenu");
    const [oldGameStates, setOldGameStates] = useState<GameState[]>(["mainMenu"]);

    const [customFlavors, _setCustomFlavors] = useState<CustomFlavor[]>([]);

    const [musicPlayers, setMusicPlayers] = useState<CustomFlavorMusic[]>([]);

    const [listContainsCustomFlavors, setListContainsCustomFlavors] = useState<boolean>(true);

    const setCustomFlavors = (v: ((s: CustomFlavor[]) => CustomFlavor[]) | CustomFlavor[]) => {

        let data = v;

        if (!Array.isArray(v)) {
            data = v(customFlavors) as CustomFlavor[];
        }

        if (!data) return;

        _setCustomFlavors(data);

        const toAdd: CustomFlavorMusic[] = [];

        for (const flavor of data as CustomFlavor[]) {
            const found = musicPlayers.find(e => e.NAME == flavor.name);
            if (found) continue;
            toAdd.push(new CustomFlavorMusic(flavor.audio, flavor.name as Flavor, flavor.colors, flavor.image));
        }
        if (toAdd.length == 0) return;
        setMusicPlayers(m => [...m, ...toAdd]);
    }


    const isReadonly = gameState == "createDish-create-viewonly";
    const currentDish = dishes.at(currentDishIndex);

    const currentDishName = useRef(generateNewDishTitle());
    const setCurrentDishName = (v: string, setOnlyCurrent: boolean = false) => {
        currentDishName.current = v;
        if (setOnlyCurrent) return;
        setDishes(dishes => dishes.map(dish => {
            if (dish.uuid !== currentDish?.uuid) return dish;
            return { ...dish, name: v };
        }));
    };

    const [mainFlavor, _setMF] = useState<MainFlavor>("Savory");
    const setMF = (v: MainFlavor) => {
        setDishes(dishes => dishes.map(dish => {
            if (dish.uuid !== currentDish?.uuid) return dish;
            return { ...dish, mainFlavor: v };
        }));
        _setMF(v);
    };

    const volumes = useRef<DishVolumes>({
        flavors: 100,
        mainFlavor: 100,
        master: 100
    });

    const setVolumes = (v: (DishVolumes | ((v: DishVolumes) => DishVolumes))) => {
        const val = typeof v == "function" ? v(volumes.current) : v;
        volumes.current = val;
        setDishes(dishes => dishes.map(dish => {
            if (dish.uuid !== currentDish?.uuid) return dish;
            return { ...dish, volumes: val };
        }));
    };

    // const [synthLines, setSynthLines, addSynthLine] = useJsObjectHookForArray<Dish | LocalDish, "data">(currentDish, "data", []);

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
        if (state !== "createDish-create") {
            multiplayerManager?.close();
            setMultiplayerManager(null);
        }
    }

    useEffect(() => {
        if (!hasLoadedUserInfoOnce.current) {
            hasLoadedUserInfoOnce.current = true;
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
                    const customFlavors = await loadAllCustomFlavorsAsMusicPlayer(userLoggedIn, setCustomFlavors);
                    if (integrateDishes && localDishes) {
                        dishes = await DishManager.loadDishesFromServer(userLoggedIn, localDishes, customFlavors);
                    } else {
                        dishes = await DishManager.loadDishesFromServer(userLoggedIn, undefined, customFlavors);
                    }

                    stopLoading("loadingDishes");
                    if (!dishes) {
                        return;
                    }
                    localStorage.removeItem("dishes");
                    localStorage.removeItem("overwriteLocalDishesToServer");
                    setDishes(dishes);
                })();
            } else {
                (async () => {
                    const customFlavors = await loadAllCustomFlavorsAsMusicPlayer(userLoggedIn, setCustomFlavors);
                    const localDishes = JSON.parse(localStorage.getItem("dishes") ?? "null") as RawLocalDish[] | null;
                    if (localDishes) {
                        setDishes(localDishes.map(e => ({ ...e, type: "localDish" })).map(e => ({ ...e, customFlavors: e.customFlavors.map(e => customFlavors.find(s => s.uuid == e)).filter(e => !!e) } as LocalDish)));
                    }
                })();
            }

            const saveDishAutomatically = async () => {
                if (!currentDish) return;
                await saveCurrentDish();
                setTimeout(saveDishAutomatically, 1 * 60 * 1000);
            };

            setTimeout(saveDishAutomatically, 1 * 60 * 1000);

        }
    }, [""]);

    const saveCurrentDish = async () => {
        if (userLoggedIn) {
            if (!currentDish) {
                Utils.error("Can't save this dish");
                return false;
            }
            await DishManager.updateEntireDish(userLoggedIn, currentDish as Dish);
        } else {
            const jsonData = JSON.stringify(dishes.filter(e => !(e as any).temporary).map(e => ({ ...e, type: "localDish" })).map(e => ({ ...e, customFlavors: e.customFlavors.map(e => e.uuid) })));
            localStorage.setItem("dishes", jsonData);
        }

        setTitle(title.replaceAll("*", ""));
        currentDishTitleRef.current?.classList.remove("unsaved-changes");
        if (savedMessageRef.current) {
            savedMessageRef.current?.setAttribute("data-open", "");
            setTimeout(() => {
                savedMessageRef.current?.removeAttribute("data-open");
            }, 2000);
        }
        return true;
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
        data: [],
        mainFlavor: "Bitter",
        name: generateNewDishTitle(),
        publishState: "private",
        createdAt: dayjs().format(DATE_FORMAT),
        createdBy: userLoggedIn?.displayName ?? "Unknown",
        share: undefined,
        temporary: undefined,
        uuid: Utils.uuidv4Exclude(dishes.map(e => e.uuid)),
        volumes: {
            flavors: 100,
            mainFlavor: 100,
            master: 100
        },
        customFlavors: [],
        type: "dish"
    }, setCurrent: boolean = true, indexToInsertAt?: number, uploadToServer: boolean = true) {
        if (indexToInsertAt != undefined) {
            dishes.splice(indexToInsertAt, 0, newDish);
        } else {
            dishes.push(newDish);
        }
        setDishes([...dishes]);
        const index = dishes.indexOf(newDish);
        if (setCurrent) {
            setCurrentDishIndex(index);
            // setCurrentDishName(newDish.name)
            currentDishName.current = newDish.name;
            setCurrentDishTitleToElement(newDish.name);
            // setSynthLines(newDish.data);
            setMainFlavor(newDish.mainFlavor);
        }

        if (uploadToServer) addedNewDish(newDish, index);
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

    const hasCheckedForDownloaded = useRef<boolean>(false);
    useEffect(() => {
        if (hasCheckedForDownloaded.current) return;
        hasCheckedForDownloaded.current = true;
        checkIfDataDownloaded().then(async e => {
            if (e) await initializeAllDownloadedResources();
            setHasDD(e);
            setHasLoaded(true);
        });
    }, []);
    const confirm = useConfirm().confirm;
    const input = useInput().input;

    const setMainFlavor = (flavor: MainFlavor) => {
        setMF(flavor);
        document.body.setAttribute("data-flavor", flavor);
        const st = document.body.style;
        st.setProperty("--main-color", MAIN_FLAVOR_COLOR[flavor][0]);
        st.setProperty("--secondary-color", MAIN_FLAVOR_COLOR[flavor][1]);
        st.setProperty("--main-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][0]));
        st.setProperty("--secondary-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][1]));
    };

    const startTutorial = useRef<((tutorial: TutorialAction) => void) | null>(null);

    const initializeAllDownloadedResources = async () => {
        startLoading("loadingAll");
        await initRotateNotice();
        await initLoadingAnimation();
        await intitializeAllAudios();
        await initCurrentPosImages();
        // await loadAllCustomFlavorsAsMusicPlayer(userLoggedIn, setCustomFlavors);
        stopLoading("loadingAll");
        startTutorial.current?.("home");
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
        const response = await Network.loadJson<OpenShareResponse>(BASE_URL + "/share/open" + URL_EXTENSION, {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                ...data
            })
        });

        stopLoading("openSharedDish");
        if (response.status == "error") {
            Utils.error("Couldn't open dish");
            return;
        }

        setMainFlavor(response.dish.mainFlavor);
        const dish: Dish = {
            ...{
                ...response.dish,
                tracks: undefined
            },
            createdAt: (response.dish as any).createdAt ?? undefined,
            createdBy: (response.dish as any).createdBy ?? "Unknown",
            data: response.dish.tracks.map(e => {
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
            customFlavors: response.dish.customFlavors.map(e => customFlavors.find(s => s.uuid == e)).filter(e => !!e),
            temporary: true
        };
        delete (dish as any).tracks;
        // const newD = [...dishes, dish];
        setDishes(dishes => {
            const newD = [...dishes, dish];
            setCurrentDishTitleToElement(dish.name);
            return newD;
        });
        setCurrentDishIndex(dishes.length);//kein -1
        setGameState("createDish-create-viewonly");
        setCurrentDishTitleToElement(dish.name);
        setCurrentDishName(dish.name, true);
    };

    const openDishFromObj = (dish: Dish | LocalDish) => {
        const index = dishes.indexOf(dish as any);
        if (index == -1) return;
        setCurrentDishIndex(index);

        console.log(dish);

        setCurrentDishTitleToElement(dish.name);
        currentDishName.current = dish.name;
        setMainFlavor(dish.mainFlavor);

        // setVolumes(dish.volumes);
        // setSynthLines(dish.data);
    }

    useEffect(() => {
        open({ type: "url", url: location.href });
    }, [location.href]);

    const goBack = () => {
        setGameState(oldGameStates.pop() ?? "mainMenu");
        setOldGameStates(oldGameStates);
    };

    const deleteDisheWithUUID = async (uuid: string) => {
        const newDishes = dishes.filter(e => e.uuid !== uuid);
        if (userLoggedIn) {
            DishManager.deleteDish(userLoggedIn, uuid);
        } else {
            localStorage.setItem("dishes", JSON.stringify(newDishes));
        }
        // setDishes(newDishes);
        Utils.success("Deleted Dish");
        setDishes(dishes => dishes.filter(e => e.uuid !== uuid));
    };

    let currentlyLoading: string[] = [];
    let oldGameState: GameState = "mainMenu";

    const startLoading = (key?: string) => {
        if (currentlyLoading.length == 0 && oldGameStates[oldGameStates.length - 1] != "loading") {
            oldGameState = gameState;
            _setGameState("loading");
        }
        if (key) currentlyLoading.push(key);
    };

    const stopLoading = (key?: string) => {
        if (key) currentlyLoading = currentlyLoading.filter(e => e !== key);
        if (currentlyLoading.length == 0) {
            setOldGameStates(oldGameStates.filter(e => e !== "loading"));
            _setGameState(oldGameState);
        }
        console.log(currentlyLoading);
    };

    const setSynthLines = (v: (FlavorSynthLine[] | ((s: FlavorSynthLine[]) => FlavorSynthLine[]))) => {
        if (!currentDish) return;
        const val = typeof v == "function" ? v(currentDish.data) : v;
        setDishes(dishes => {
            return dishes.map(dish => {
                if (dish.uuid != currentDish.uuid) return dish;
                return {
                    ...dish,
                    data: val
                };
            });
        })
    }


    const onSynthLineChanged = () => {
        if (title.startsWith("*")) return;
        setTitle("*" + title);
        currentDishTitleRef.current?.classList.add("unsaved-changes");
    };

    const forkCurrentDish = () => {
        if (!isReadonly || !currentDish) return;

        let title = null;

        setDishes(dishes => dishes.map(dish => {
            if (dish.uuid !== currentDish.uuid) return dish;
            if (!(dish as Dish).temporary) return dish;
            title = dish.name + " (Forked)";
            return {
                ...(dish as Dish),
                createdBy: userLoggedIn?.displayName ?? "Unknown",
                temporary: undefined,
                share: undefined,
                createdAt: dayjs().format(DATE_FORMAT),
                name: title,
                uuid: Utils.uuidv4Exclude(dishes.map(e => e.uuid))
            } as Dish;
        }));
        setGameState("createDish-create");
        saveCurrentDish();
        setTitle
        if (title) setCurrentDishTitleToElement(title);
    }

    const currentDraggingElementRef = useRef<Flavor | null>(null);

    const [shouldRotateDeviceVar, setShouldRotateDevice] = useState<boolean>(isDeviceAspectRatioFitForApp() && shouldRotateDevice());
    const [isDeviceSupported, setIsDeviceSupported] = useState<boolean>(isDeviceAspectRatioFitForApp());

    useEffect(() => {

        const resized = () => {

            const isSupported = isDeviceAspectRatioFitForApp();
            const rotate = shouldRotateDevice();
            setShouldRotateDevice(rotate);
            setIsDeviceSupported(isSupported);

        };

        window.addEventListener("resize", resized);

        return () => {
            window.removeEventListener("resize", resized);
        }

    }, []);

    const deselectAllRef = useRef<{ [key: string]: () => void }>({});

    const setDeselectAllCallback = (name: string, deselect: (() => void)) => {
        deselectAllRef.current[name] = deselect;
    };

    const deselectAll = () => {
        Object.values(deselectAllRef.current).forEach(e => e());
    };

    const startMultiplayer = async () => {
        if (multiplayerManager) return;
        const tempMultiplayerManager = new MultiplayerServer();
        if (!currentDish) {
            Utils.error("You dont have a dish open");
            return;
        }
        let name: string | undefined | false = userLoggedIn?.displayName
        if (!userLoggedIn || !name) {
            name = await input("Type a name with wich you want to join the meeting:", "cancelOk", "text");
        }

        if (!name) return;

        const saveResponse = await saveCurrentDish();
        if (!saveResponse) {
            Utils.error("Failed to save the dish");
            return;
        }

        let response = await tempMultiplayerManager.create({
            mainFlavor: currentDish.mainFlavor,
            name: currentDish.name,
            publishState: "private",
            share: undefined,
            tracks: currentDish.data,
            type: "dish",
            uuid: currentDish.uuid,
            volumes: currentDish.volumes,
            customFlavors: currentDish.customFlavors
        }, name, userLoggedIn?.jwt);

        if (!response) return false;

        const code = tempMultiplayerManager.getCode();
        if (!code) {
            Utils.error("Failed to get code to share! Try again later");
            return;
        }

        setIsMultiplayer(true);
        setMultiplayerCode(code);
        setMultiplayerOverlayOpen(true);
        setMultiplayerName(name);
        setMultiplayerManager(tempMultiplayerManager);

        initDefaultsMultiplayer(tempMultiplayerManager);
    };

    const joinGame = async (digits: ShareDigits) => {
        if (multiplayerManager) return;
        const tempMultiplayerManager = new MultiplayerServer();

        let name: string | undefined | false = userLoggedIn?.displayName
        if (!userLoggedIn || !name) {
            name = await input("Type a name with wich you want to join the meeting:", "cancelOk", "text");
        }

        if (!name) {
            tempMultiplayerManager.close();
            setMultiplayerManager(null);
            return;
        }

        let response = await tempMultiplayerManager.join(digits, name, userLoggedIn?.jwt);
        if (!response) {
            tempMultiplayerManager.close();
            setMultiplayerManager(null);
            return false;
        }

        const server = tempMultiplayerManager.getServerCommunication();


        // multiplayerManager.getServerCommunication().onPlayerJoin = (_: number, playerJoined: PlayerJoined) => {
        //     setPlayersJoined(players => [...players, playerJoined]);
        //     return true;
        // };

        await reloadMultiplayerDish(server);

        setIsMultiplayer(true);
        // setMultiplayerCode(code);
        setMultiplayerOverlayOpen(true);
        setMultiplayerName(name);
        setMultiplayerManager(tempMultiplayerManager);

        setGameState("createDish-create");

        initDefaultsMultiplayer(tempMultiplayerManager);
    }

    async function reloadMultiplayerDish(server: ServerCommunication) {
        const dishLoadResponse = await server.send<any, APIResponse<{ dish: MultiplayerServerDish }>>({
            type: "getDish"
        });

        if (dishLoadResponse.status == "error") {
            Utils.error("Failed to load dish from server");
            return;
        }

        const dish = dishLoadResponse.dish;

        createNewActiveDish({
            createdAt: dayjs().format("DD/MM/YYYY HH:mm:ss"),
            createdBy: dish.createdBy,
            data: dish.tracks as FlavorSynthLine[],
            mainFlavor: dish.mainFlavor,
            name: dish.name,
            publishState: dish.publishState,
            share: dish.share,
            uuid: dish.uuid,
            volumes: dish.volumes,
            type: "dish",
            customFlavors: dish.customFlavors,
            temporary: true
        }, true, 0, false);
    }

    async function initDefaultsMultiplayer(multiplayerManager: MultiplayerServer) {
        const server = multiplayerManager.getServerCommunication();

        server.onRename.add("main", (newName) => {
            setCurrentDishTitleToElement(newName);
            setCurrentDishName(newName);
        });

        server.onSave.add("main", () => {
            if (!multiplayerManager?.isOwner()) return;
            saveCurrentDish();
        });

        server.onClose.add("main", (reason) => {
            multiplayerManager?.close();
            setMultiplayerManager(null);
            setGameState("mainMenu");
            Utils.error(reason);
        });

        server.onPlayerLeft.add("main", (playerLeft) => {
            console.log(`Player ${playerLeft.name} left the game`);
            Utils.notification(`Player ${playerLeft.name} left the game`);
        });

        server.onKick.add("main", () => {
            multiplayerManager?.close();
            setMultiplayerManager(null);
            setGameState("mainMenu");
            Utils.error("You got kicked!");
        });

        server.onMute.add("main", (is) => {
            setMultiplayerMuted(is);
            if (is) {
                Utils.error("You got muted");
            } else {
                Utils.success("You got unmuted");
            }
        });

        server.onViewOnly.add("main", async (is) => {
            if (is) {
                setGameState("createDish-create-viewonly");
                Utils.error("You can now only view");
            } else {
                await reloadMultiplayerDish(server);
                setGameState("createDish-create");
                Utils.success("You can edit again");
            }
        });


        server.onChatMessageReceive = (message: ChatMessage) => {
            setUnreadChatMessageCount(count => count + 1);
            setChatMessages(messages => [...messages, message]);
            Utils.notification("You have a new Chat message");
        };

        // server.onVolumeChanged = (newVolume, volumeSlot) => {
        //     setVolumes(volumes => {
        //         const v = {
        //             ...volumes
        //         };
        //         v[volumeSlot] = newVolume;
        //         return v;
        //     })
        // };
    }

    return <>
        <CustomFlavors.Provider value={{
            customFlavors,
            musicPlayers,
            setCustomFlavors,
            listContainsCustomFlavors,
            setListContainsCustomFlavors
        }}>
            <MultiplayerContext.Provider value={{
                isMultiplayer,
                manager: multiplayerManager,
                startMultiplayer,
                playersJoined,
                multiplayerCode,
                setMultiplayerOverlayOpen,
                setMultiplayerChatOpen,
                isMultiplayerOverlayOpen,
                isMultiplayerChatOpen,
                joinGame,
                setPlayersJoined,
                unreadChatMessageCount,
                setUnreadChatMessageCount,
                chatMessages,
                setChatMessages,
                name: multiplayerName,
                isMultiplayerMuted
            }}>
                <CurrentDraggingElementTouch.Provider value={{ currentDraggingElement: currentDraggingElementRef, setDeselectAllCallback, deselectAll }}>
                    <TouchCheckerContext.Provider value={{ isTouch: "ontouchstart" in window }}>
                        <SynthChangeContext.Provider value={{ changed: onSynthLineChanged }}>
                            <LoadingAnimationContext.Provider value={{ startLoading, stopLoading }}>
                                <CurrentDishActionsContext value={{ synthLines: [currentDish?.data ?? [], setSynthLines], volumes: [volumes, setVolumes] }}>
                                    <MainFlavorContext.Provider value={{ mainFlavor, setMainFlavor }}>
                                        <GameStateContext.Provider value={{ gameState, setGameState, goBack, createNewActiveDish }}>
                                            <CurrentDishIndexContext.Provider value={{ val: currentDishIndex, setIndex: setCurrentDishIndex, openDishFromObj }}>
                                                <DishesContext.Provider value={{ dishes, setDishes, saveCurrentDish: withDebounce(saveCurrentDish, 2000), deleteDisheWithUUID, forkCurrentDish: withDebounce(forkCurrentDish, 10000) }}>
                                                    <UserContext.Provider value={{ user: userLoggedIn, setUser: setUserLoggedIn }}>
                                                        <ToastContainer position="bottom-right" draggable newestOnTop theme="dark" />
                                                        <Tutorials startTutorialRef={startTutorial}>

                                                            {
                                                                hasDownloadedData && shouldRotateDeviceVar && <RotateDeviceNotice />
                                                            }

                                                            {
                                                                !isDeviceSupported && <DeviceNotSupported />
                                                            }

                                                            {/* <Activity mode={gameState == "customFlavors" ? "visible" : "hidden"}>
                                                                <CustomFlavorMenu />
                                                            </Activity>

                                                            <Activity mode={gameState == "mainMenu" ? "visible" : "hidden"}>
                                                                <InitialMenu />
                                                            </Activity>

                                                            <Activity mode={gameState == "restaurant" ? "visible" : "hidden"}>
                                                                <Restaurant />
                                                            </Activity>

                                                            <Activity mode={!hasDownloadedData || currentlyLoading.includes("downloadData") ? "visible" : "hidden"}>
                                                                <Download hasLoaded={hasLoaded} downloadFinished={async () => { await initializeAllDownloadedResources(); setHasDD(true); }} hasDownloadedAssets={hasDownloadedData}></Download>
                                                            </Activity>

                                                            <Activity mode={gameState == "createDish-mainFlavor" ? "visible" : "hidden"}>
                                                                <MainFlavorSelectionDialog />
                                                            </Activity> */}

                                                            {
                                                                gameState == "customFlavors" && <CustomFlavorMenu />
                                                            }

                                                            {
                                                                gameState == "mainMenu" && <InitialMenu />
                                                            }

                                                            {
                                                                gameState == "restaurant" && <Restaurant />
                                                            }

                                                            {
                                                                (!hasDownloadedData || currentlyLoading.includes("downloadData")) && <Download hasLoaded={hasLoaded} downloadFinished={async () => { await initializeAllDownloadedResources(); setHasDD(true); }} hasDownloadedAssets={hasDownloadedData}></Download>
                                                            }

                                                            {
                                                                gameState == "createDish-mainFlavor" && <MainFlavorSelectionDialog />
                                                            }


                                                            {
                                                                (gameState == "createDish-create" || gameState == "createDish-create-viewonly") && <>
                                                                    <div className="title">
                                                                        <div className="bg-wrapper">
                                                                            <div className="img-wrapper">
                                                                                <img src="./imgs/nameTag/name_tag_left.png" className="bg-image-start"></img>
                                                                                <div className="bg-image"></div>
                                                                                <img src="./imgs/nameTag/name_tag_right.png" className="bg-image-end"></img>
                                                                            </div>
                                                                            <input className="title-input" maxLength={20} type="text" disabled={isReadonly} onInput={() => {
                                                                                if (currentDishTitleRef.current && !isReadonly) {
                                                                                    const newName = currentDishTitleRef.current.value == undefined || currentDishTitleRef.current.value == null ? "Unnamed" : currentDishTitleRef.current.value;
                                                                                    setCurrentDishName(newName);
                                                                                    multiplayerManager?.getServerCommunication()?.rename(newName);
                                                                                }
                                                                            }} ref={(e) => { currentDishTitleRef.current = e; e && (e.value = currentDishName.current) }}></input>
                                                                        </div>
                                                                    </div>

                                                                    <MultiplayerSettingsOverlay />
                                                                    <MultiplayerChatOverlay />

                                                                    <CurrentMainThemeSelector />
                                                                    <FlavorSynth />

                                                                    <button className="close" onClick={async () => {
                                                                        if (!document.title.startsWith("*")) {
                                                                            setGameState("mainMenu");
                                                                            return;
                                                                        }
                                                                        const close = await confirm("Do you want to close the dish and loose all unsaved changes?", "noYes");
                                                                        if (close) {
                                                                            setTitle(title.replaceAll("*", ""));
                                                                            setGameState("mainMenu");
                                                                        }
                                                                    }}>x</button>
                                                                </>
                                                            }

                                                            {/* <Activity mode={gameState == "createDish-create" || gameState == "createDish-create-viewonly" ? "visible" : "hidden"}>
                            </Activity> */}


                                                            {
                                                                gameState == "createDish-share" && <ShareDialog></ShareDialog>
                                                            }

                                                            {
                                                                (gameState == "createDish-create" || gameState == "openShared" || gameState == "createDish-share") && <FlavorDragNDropList hasDownloaded={hasDownloadedData}></FlavorDragNDropList>
                                                            }

                                                            {
                                                                gameState == "openShared" && <OpenShareDialog open={open}></OpenShareDialog>
                                                            }

                                                            {
                                                                gameState == "dishList" && <DishList />
                                                            }

                                                            {/* <Activity mode={gameState == "createDish-share" ? "visible" : "hidden"}>
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
                                                            </Activity> */}

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

                                                        </Tutorials>
                                                    </UserContext.Provider>
                                                </DishesContext.Provider>
                                            </CurrentDishIndexContext.Provider>
                                        </GameStateContext.Provider>
                                    </MainFlavorContext.Provider>
                                </CurrentDishActionsContext>
                            </LoadingAnimationContext.Provider>
                        </SynthChangeContext.Provider>
                    </TouchCheckerContext.Provider>
                </CurrentDraggingElementTouch.Provider>
            </MultiplayerContext.Provider>
        </CustomFlavors.Provider>
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
    const val = localStorage.getItem(DOWNLOAD_PROGRESS_KEY);
    if (val != null) return false;

    const dbs = await indexedDB.databases();

    const isValid = await new Promise<boolean>(async (res) => {
        const all: Promise<boolean>[] = [];
        for (let i = 0; i <= 99; i++) {
            all.push(hasResource("currentCursorPositionAnimation", "image_" + i + ".png"));
        }

        for (let i = 0; i <= 42; i++) {
            all.push(hasResource("flavors", i + ".wav"));
        }

        for (let i = 0; i <= 21; i++) {
            all.push(hasResource("pot-animation", "image_" + i + ".png"));
        }

        for (const i of ["bitter", "salty", "savory", "sour", "spicy", "sweet"]) {
            all.push(hasResource("mainFlavors", i + "_finished.mp3"));
        }

        for (let i = 0; i <= 9; i++) {
            all.push(hasResource("rotateDevice", i + ".png"));
        }
        const allPromises = await Promise.all(all);
        const hasFoundFalse = allPromises.some(e => !e);
        res(!hasFoundFalse);
    });

    return dbs.length >= DOWNLOAD_GROUP_COUNT && isValid;
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

function shouldRotateDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    if (aspectRatio < 0.7) return true;

    if (width < 400) return true;
    // if (height < 400) return true;
    return false;
}

function isDeviceAspectRatioFitForApp() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width < 500 || height < 500) return false;

    if (width < 600 && height < 500) return false;
    return true;
}