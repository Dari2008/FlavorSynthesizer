import { useRef, useState } from "react"
import { MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors"
import "./CurrentMainThemeSelector.scss"
import { MAIN_FLAVORS } from "../../audio/Flavors";

export default function CurrentMainThemeSelector({ mainFlavor }: { mainFlavor: MainFlavor }) {

    const [isOpen, setOpen] = useState<boolean>(false);

    return <div className="current-main-theme-selector">
        {/* <span className="main-flavor-label">
            Main Flavor
        </span> */}
        <div className="elements-wrapper">
            <FlavorElement flavor={mainFlavor} />
        </div>

    </div >
}

function FlavorElement({ flavor }: { flavor: MainFlavor }) {
    return <div className="main-flavor-wrapper">
        <div className="main-flavor">
            <img src={MAIN_FLAVOR_IMAGES[flavor]} alt={flavor} />
            <span className="main-flavor-name">Main Flavor</span>
        </div>
    </div>
}