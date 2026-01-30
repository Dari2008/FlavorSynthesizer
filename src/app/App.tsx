import { Activity, useEffect, useRef, useState } from "react";
import { FLAVORS } from "../audio/Flavors";
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

export default function App() {
    const [mainFlavor, setMF] = useState<MainFlavor>("Savory");
    const [hasSelectedNewMainFlavor, setHasSelectedNewMainFlavor] = useState<boolean>(false);
    const reselectMainFlavorRef = useRef<() => void>(() => 0);
    const isFirstTimeOpen = useRef<boolean>(true);
    const synthLinesWrapped = useState<FlavorSynthLine[]>([]);
    const [isOpenedDish, setIsOpenedDish] = useState<boolean>(false);
    const [isShareOpen, setShareOpen] = useState<boolean>(false);
    const [isOpenShareOpen, setOpenShareOpen] = useState<boolean>(false);
    const confirm = useConfirm().confirm;

    const setMainFlavor = (flavor: MainFlavor) => {
        isFirstTimeOpen.current = false;
        setMF(flavor);
        setHasSelectedNewMainFlavor(true);
        document.body.setAttribute("data-flavor", flavor);
        const st = document.body.style;
        st.setProperty("--main-color", MAIN_FLAVOR_COLOR[flavor][0]);
        st.setProperty("--secondary-color", MAIN_FLAVOR_COLOR[flavor][1]);
        st.setProperty("--main-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][0]));
        st.setProperty("--secondary-color-rgb", toRGB(MAIN_FLAVOR_COLOR[flavor][1]));
    };

    const openSelectMainFlavor = () => {
        setHasSelectedNewMainFlavor(false);
        setTimeout(() => {
            reselectMainFlavorRef.current();
        }, 300);
    };



    const open = async (data: OpenData) => {
        if (getTrackData().length != 0) {
            const want = await confirm("Do you want to override the current tracks?", "noYes");
            if (!want) return;
        }

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
        synthLinesWrapped[1](response.tracks.map(e => {
            return {
                uuid: Utils.uuidv4(),
                muted: e.muted,
                solo: e.solo,
                volume: e.volume,
                elements: e.elements.map(e => {
                    return createElementForFlavor(e.flavor, e.from, e.to);
                })
            }
        }));
        setIsOpenedDish(true);
        setOpenShareOpen(false);
        setHasSelectedNewMainFlavor(true);
    };


    const getTrackData = (): FlavorSynthLine[] => {
        return synthLinesWrapped[0];
    };
    useEffect(() => {
        open({ type: "url", url: location.href });
    }, [location.href]);

    return <>
        <ToastContainer position="bottom-right" draggable newestOnTop theme="dark" />

        <Activity mode={hasSelectedNewMainFlavor ? "hidden" : "visible"}>
            <MainFlavorSelectionDialog isFirstTimeOpen={isFirstTimeOpen.current} setSelectedMainFlavor={setMainFlavor} reselectMainFlavorRef={reselectMainFlavorRef}></MainFlavorSelectionDialog>
        </Activity>

        <Activity mode={hasSelectedNewMainFlavor ? "visible" : "hidden"}>
            <div className="title">
                <h1>Flavor Synthesizer</h1>
                <span className="subtitle">Cook Up a Beat</span>
            </div>

            <CurrentMainThemeSelector mainFlavor={mainFlavor} repickMainFlavor={openSelectMainFlavor}></CurrentMainThemeSelector>

            <FlavorSynth mainFlavor={mainFlavor} synthLinesWrapped={synthLinesWrapped} openShare={() => setShareOpen(true)} openOpenShare={() => setOpenShareOpen(true)}>
            </FlavorSynth>
            <FlavorDragNDropList flavors={FLAVORS}></FlavorDragNDropList>
            <Activity mode={isShareOpen ? "visible" : "hidden"}>
                <ShareDialog getMainFlavor={() => mainFlavor} getTrackData={getTrackData} visible={isShareOpen} setShareDialogOpened={setShareOpen}></ShareDialog>
            </Activity>
            <Activity mode={isOpenShareOpen ? "visible" : "hidden"}>
                <OpenShareDialog open={open} visible={isOpenShareOpen} setOpenShareDialogOpened={setOpenShareOpen}></OpenShareDialog>
            </Activity>


        </Activity>

        {/* {

            !hasSelectedNewMainFlavor && 
        } */}
        {/* {
            hasSelectedNewMainFlavor &&
            <>
            </>
        } */}

    </>
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
