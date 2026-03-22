import FlavorDragNDropListItem from "./FlavorDragNDropListItem";
import "./FlavorDragNDropList.scss";
import { FLAVORS } from "../../audio/Flavors";
import PixelButton from "../pixelDiv/PixelButton";
import AddCustomFlavorDialog from "../addCustomFlavor/AddCustomFlavorDialog";
import { useState } from "react";
import { useCustomFlavors } from "../../contexts/CustomFlavors";
import type { Flavor } from "../../@types/Flavors";
import { CustomFlavorMusic } from "../../audio/FlavorMusic";
import { useCurrentDish } from "../../contexts/CurrentDish";

type Props = {
    hasDownloaded: boolean;
}

export default function FlavorDragNDropList({ hasDownloaded }: Props) {

    const [isAddCustomOpen, setCustomOpen] = useState<boolean>(false);
    const customFlavors = useCustomFlavors();
    const currentDish = useCurrentDish();

    const onClose = () => {
        setCustomOpen(false);
    };


    const allFlavors = [...FLAVORS, ...(customFlavors.listContainsCustomFlavors ? customFlavors.musicPlayers : [])].map(e => e.NAME);
    const uniquePerDishCustomFlavors = currentDish?.customFlavors.filter(e => !allFlavors.includes(e.name as Flavor)).map(e => new CustomFlavorMusic(e.audio, e.name as Flavor, e.colors, e.image));

    return <>
        <ul className="flavor-drag-n-drop-list">
            {FLAVORS.map(flavor => <FlavorDragNDropListItem isCustomFlavor={false} key={flavor.NAME} hasDownloaded={hasDownloaded} player={flavor}></FlavorDragNDropListItem>)}
            {[...(customFlavors.listContainsCustomFlavors ? customFlavors.musicPlayers : [])].map(flavor => <FlavorDragNDropListItem isCustomFlavor={true} key={flavor.NAME} hasDownloaded={hasDownloaded} player={flavor}></FlavorDragNDropListItem>)}
            {uniquePerDishCustomFlavors && uniquePerDishCustomFlavors.map(flavor => <FlavorDragNDropListItem isCustomFlavor={true} key={flavor.NAME} hasDownloaded={hasDownloaded} player={flavor}></FlavorDragNDropListItem>)}

            <li className="add-custom">
                <PixelButton max-pixel-width={15} onClick={() => setCustomOpen(true)}>Add a Custom Flavor</PixelButton>
            </li>
        </ul>
        {
            isAddCustomOpen && <AddCustomFlavorDialog onClose={onClose}></AddCustomFlavorDialog>
        }
    </>
}