import { useRef, useState } from "react";
import { FLAVORS } from "../audio/Flavors";
import CurrentMainThemeSelector from "../components/currentMainTheme/CurrentMainThemeSelector";
import FlavorDragNDropList from "../components/flavor-dragn-drop-list/FlavorDragNDropList";
import FlavorSynth, { type FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
import "./App.scss";
import { MAIN_FLAVOR_COLOR, type MainFlavor } from "../@types/Flavors";
import MainFlavorSelectionDialog from "../components/MainFlavorSelectionDialog/MainFlavorSelectionDialog";

export default function App() {
    const [mainFlavor, setMF] = useState<MainFlavor>("Savory");
    const [hasSelectedNewMainFlavor, setHasSelectedNewMainFlavor] = useState<boolean>(false);
    const reselectMainFlavorRef = useRef<() => void>(() => 0);
    const isFirstTimeOpen = useRef<boolean>(true);
    const synthLinesWrapped = useState<FlavorSynthLine[]>([]);

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

    return <>

        {
            !hasSelectedNewMainFlavor && <MainFlavorSelectionDialog isFirstTimeOpen={isFirstTimeOpen.current} setSelectedMainFlavor={setMainFlavor} reselectMainFlavorRef={reselectMainFlavorRef}></MainFlavorSelectionDialog>
        }
        {
            hasSelectedNewMainFlavor &&
            <>
                <div className="title">
                    <h1>Flavor Synthesizer</h1>
                    <span className="subtitle">Cook Up a Beat</span>
                </div>

                <CurrentMainThemeSelector mainFlavor={mainFlavor} repickMainFlavor={openSelectMainFlavor}></CurrentMainThemeSelector>

                <FlavorSynth mainFlavor={mainFlavor} synthLinesWrapped={synthLinesWrapped}></FlavorSynth>
                <FlavorDragNDropList flavors={FLAVORS}></FlavorDragNDropList>
            </>
        }

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
