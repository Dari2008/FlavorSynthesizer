import { useRef, useState } from "react";
import { FLAVORS } from "../audio/Flavors";
import CurrentMainThemeSelector from "../components/currentMainTheme/CurrentMainThemeSelector";
import FlavorDragNDropList from "../components/flavor-dragn-drop-list/FlavorDragNDropList";
import FlavorSynth from "../components/flavorSynth/FlavorSynth";
import "./App.scss";
import type { MainFlavor } from "../@types/Flavors";
import MainFlavorSelectionDialog from "../components/MainFlavorSelectionDialog/MainFlavorSelectionDialog";

export default function App() {
    const [mainFlavor, setMF] = useState<MainFlavor>("Savory");
    const [hasSelectedNewMainFlavor, setHasSelectedNewMainFlavor] = useState<boolean>(false);
    const reselectMainFlavorRef = useRef<() => void>(() => 0);

    const setMainFlavor = (flavor: MainFlavor) => {
        setMF(flavor);
        setHasSelectedNewMainFlavor(true);
    };

    const openSelectMainFlavor = () => {
        setHasSelectedNewMainFlavor(false);
        setTimeout(() => {
            reselectMainFlavorRef.current();
        }, 300);
    };

    return <>

        {
            !hasSelectedNewMainFlavor && <MainFlavorSelectionDialog setSelectedMainFlavor={setMainFlavor} reselectMainFlavorRef={reselectMainFlavorRef}></MainFlavorSelectionDialog>
        }
        {
            hasSelectedNewMainFlavor &&
            <>
                <div className="title">
                    <h1>Flavor Synthesizer</h1>
                    <span className="subtitle">Cook Up a Beat</span>
                </div>

                <CurrentMainThemeSelector mainFlavor={mainFlavor} repickMainFlavor={openSelectMainFlavor}></CurrentMainThemeSelector>

                <FlavorSynth></FlavorSynth>
                <FlavorDragNDropList flavors={FLAVORS}></FlavorDragNDropList>
            </>
        }

    </>
}