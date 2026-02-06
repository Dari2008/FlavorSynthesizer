import { useRef, useState } from "react"
import { MAIN_FLAVOR_COLOR, MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors"
import "./CurrentMainThemeSelector.scss"
import { MAIN_FLAVORS } from "../../audio/Flavors";
import { useGameState } from "../../contexts/GameStateContext";
import { useMainFlavor } from "../../contexts/MainFlavorContext";

export default function CurrentMainThemeSelector() {
    const gameState = useGameState();

    return <div className="current-main-theme-selector" onClick={() => gameState.setGameState("createDish-mainFlavor")}>
        <div className="elements-wrapper">
            <FlavorElement />
        </div>
    </div >
}

function FlavorElement() {
    const flavor = useMainFlavor().mainFlavor;
    return <div className="main-flavor">
        <div className="border-wrapper">
            <div className="bgImage main-color" style={{ "--main-color": MAIN_FLAVOR_COLOR[flavor][0] } as any}></div>
            <div className="bgImage main-color-2" style={{ "--vine-color": MAIN_FLAVOR_COLOR[flavor][1] } as any}></div>
            <img src={MAIN_FLAVOR_IMAGES[flavor]} alt={flavor} />
        </div>
        <span className="main-flavor-name">Main Flavor</span>
    </div>
}