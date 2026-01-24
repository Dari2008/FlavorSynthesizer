import { useRef, useState } from "react"
import { MAIN_FLAVOR_COLOR, MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors"
import "./CurrentMainThemeSelector.scss"
import { MAIN_FLAVORS } from "../../audio/Flavors";

export default function CurrentMainThemeSelector({ mainFlavor, repickMainFlavor }: { mainFlavor: MainFlavor; repickMainFlavor: () => void }) {
    return <div className="current-main-theme-selector" onClick={repickMainFlavor}>
        <div className="elements-wrapper">
            <FlavorElement flavor={mainFlavor} />
        </div>
    </div >
}

function FlavorElement({ flavor }: { flavor: MainFlavor }) {
    return <div className="main-flavor">
        <div className="border-wrapper">
            <div className="bgImage main-color" style={{ "--main-color": MAIN_FLAVOR_COLOR[flavor][0] } as any}></div>
            <div className="bgImage main-color-2" style={{ "--vine-color": MAIN_FLAVOR_COLOR[flavor][1] } as any}></div>
            <img src={MAIN_FLAVOR_IMAGES[flavor]} alt={flavor} />
        </div>
        <span className="main-flavor-name">Main Flavor</span>
    </div>
}