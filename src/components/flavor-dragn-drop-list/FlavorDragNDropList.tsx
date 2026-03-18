import FlavorDragNDropListItem from "./FlavorDragNDropListItem";
import "./FlavorDragNDropList.scss";
import { FLAVORS } from "../../audio/Flavors";
import PixelButton from "../pixelDiv/PixelButton";
import AddCustomFlavorDialog from "../addCustomFlavor/AddCustomFlavorDialog";
import { useState } from "react";
import { useCustomFlavors } from "../../contexts/CustomFlavors";

type Props = {
    hasDownloaded: boolean;
}

export default function FlavorDragNDropList({ hasDownloaded }: Props) {

    const [isAddCustomOpen, setCustomOpen] = useState<boolean>(false);
    const customFlavors = useCustomFlavors();

    const onClose = () => {
        setCustomOpen(false);
    };

    console.log(customFlavors.listContainsCustomFlavors, customFlavors.musicPlayers);

    return <>
        <ul className="flavor-drag-n-drop-list">
            {[...FLAVORS, ...(customFlavors.listContainsCustomFlavors ? customFlavors.musicPlayers : [])].map(flavor => <FlavorDragNDropListItem key={flavor.NAME} hasDownloaded={hasDownloaded} player={flavor}></FlavorDragNDropListItem>)}
            <li className="add-custom">
                <PixelButton max-pixel-width={15} onClick={() => setCustomOpen(true)}>Add a Custom Flavor</PixelButton>
            </li>
        </ul>
        {
            isAddCustomOpen && <AddCustomFlavorDialog onClose={onClose}></AddCustomFlavorDialog>
        }
    </>
}