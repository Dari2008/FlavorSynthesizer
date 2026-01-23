import type React from "react";
import { MAIN_FLAVOR_COLOR, MAIN_FLAVOR_IMAGES, type MainFlavor } from "../../@types/Flavors"
import { useRef } from "react";
import "./MainFlavorSelectionDialog.scss";
import { MAIN_FLAVORS } from "../../audio/Flavors";

type Props = {
    setSelectedMainFlavor: (flavor: MainFlavor) => void;
    reselectMainFlavorRef: React.RefObject<() => void>;
}

export default function MainFlavorSelectionDialog({ setSelectedMainFlavor, reselectMainFlavorRef }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const isFirstOpen = useRef<boolean>(true);

    const reselect = () => {
        dialogRef.current?.showModal();
    };

    const close = () => {
        dialogRef.current?.close();
    };

    const selectedFlavor = (flavor: MainFlavor) => {
        close();
        setSelectedMainFlavor(flavor);
    };

    reselectMainFlavorRef.current = reselect;

    return <dialog className="main-flavor-selection-dialog" ref={(ref) => { dialogRef.current = ref; ref?.show() }}>
        <h1>Select Main Flavor</h1>
        <div className="flavor-list">
            {
                MAIN_FLAVORS.map(e => e.FLAVOR_NAME).filter(e => !!e).map(name => {
                    return <div key={name} className="main-flavor-entry" onClick={() => selectedFlavor(name)}>
                        <div className="bgImage main-color" style={{ "--main-color": MAIN_FLAVOR_COLOR[name][0] } as any}></div>
                        <div className="bgImage main-color-2" style={{ "--vine-color": MAIN_FLAVOR_COLOR[name][1] } as any}></div>
                        <img src={MAIN_FLAVOR_IMAGES[name]} alt={name} className="flavor-image" />
                        <label htmlFor=".main-flavor-entry">{name}</label>
                    </div>
                })
            }
        </div>
        {
            !isFirstOpen.current && <button className="close" onClick={close}>x</button>
        }
    </dialog>
}