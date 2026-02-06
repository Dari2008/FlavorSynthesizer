import type React from "react";
import { MAIN_FLAVOR_COLOR, MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors"
import { useRef, useState } from "react";
import "./MainFlavorSelectionDialog.scss";
import { MAIN_FLAVORS } from "../../audio/Flavors";
import { useGameState } from "../../contexts/GameStateContext";
import { useMainFlavor } from "../../contexts/MainFlavorContext";

type Props = {
    reselectMainFlavorRef: React.RefObject<() => void>;
}

export default function MainFlavorSelectionDialog({ reselectMainFlavorRef }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const gameState = useGameState();
    const mainFlavor = useMainFlavor();

    const reselect = () => {
        if (dialogRef.current?.open) return;
        dialogRef.current?.showModal();
    };

    const close = () => {
        gameState.goBack();
        if (!dialogRef.current?.open) return;
        dialogRef.current?.close();
    };

    const selectedFlavor = (flavor: MainFlavor) => {
        setTimeout(() => {
            // setSelectedMainFlavor(flavor);
            mainFlavor.setMainFlavor(flavor);
            gameState.setGameState("createDish-create");
        }, 300);
    };

    reselectMainFlavorRef.current = reselect;

    return <dialog className="main-flavor-selection-dialog" ref={(ref) => { dialogRef.current = ref; ref?.show() }}>
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
    </dialog>
}