import { MAIN_FLAVOR_COLOR, MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors"
import "./MainFlavorSelectionDialog.scss";
import { MAIN_FLAVORS } from "../../audio/Flavors";
import { useGameState } from "../../contexts/GameStateContext";
import { useMainFlavor } from "../../contexts/MainFlavorContext";

export default function MainFlavorSelectionDialog() {

    const gameState = useGameState();
    const mainFlavor = useMainFlavor();

    const close = () => {
        gameState.goBack();
    };

    const selectedFlavor = (flavor: MainFlavor) => {
        setTimeout(() => {
            // setSelectedMainFlavor(flavor);
            mainFlavor.setMainFlavor(flavor);
            gameState.setGameState("createDish-create");
        }, 300);
    };

    return <div className="main-flavor-selection-dialog">
        <h1>Select Main Flavor</h1>
        <div className="flavor-list">
            {
                MAIN_FLAVORS.map(e => e.NAME).filter(e => !!e).map(name => {
                    return <div key={name} className="main-flavor-entry" onClick={() => selectedFlavor(name)}>
                        <div className="bgImage main-color" style={{ "--main-color": MAIN_FLAVOR_COLOR[name][0] } as any}></div>
                        <div className="bgImage main-color-2" style={{ "--vine-color": MAIN_FLAVOR_COLOR[name][1] } as any}></div>
                        <img src={MAIN_FLAVOR_IMAGES[name]} alt={name} className="flavor-image" />
                        <label htmlFor=".main-flavor-entry">{name}</label>
                    </div>
                })
            }
        </div>
        <button className="close" onClick={close}>x</button>
    </div>
}