import { useState } from "react";
import { useCustomFlavors } from "../../contexts/CustomFlavors";
import { useGameState } from "../../contexts/GameStateContext";
import AddCustomFlavorDialog from "../addCustomFlavor/AddCustomFlavorDialog";
import PixelButton from "../pixelDiv/PixelButton";
import CustomFlavorItem from "./CustomFlavorItem";
import "./CustomFlavorMenu.scss";
import { deleteCustomFlavor, updateCustomFlavor, type CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";

export default function CustomFlavorMenu() {

    const gameState = useGameState();
    const customFlavors = useCustomFlavors();
    const [isAddDialogOpen, setAddDialogOpen] = useState<boolean>(false);
    const [openCustomFlavor, setOpenCustomFlavor] = useState<CustomFlavor | null>(null);

    const onEdit = (customFlavor: CustomFlavor) => {
        setOpenCustomFlavor(customFlavor);
        setAddDialogOpen(true);
    };

    const onDelete = (customFlavor: CustomFlavor) => {
        deleteCustomFlavor(customFlavor, customFlavors);
    }


    const onUpdate = (audio: string, image: string, colors: [string, string, string], flavorName: string) => {
        if (!openCustomFlavor) return;
        updateCustomFlavor(openCustomFlavor.flavorName, {
            audio, image, colors, flavorName
        }, customFlavors);
    }

    return <div className="custom-flavor-menu">
        <h1>Custom Flavors</h1>
        <button className="close" onClick={() => gameState.goBack()}>x</button>

        <ul className="custom-flavor-list">
            {
                customFlavors.customFlavors.map(flavor => <CustomFlavorItem key={flavor.flavorName} onDelete={() => onDelete(flavor)} onEdit={() => onEdit(flavor)} flavor={flavor} />)
            }
        </ul>

        <PixelButton max-pixel-width={10} onClick={() => setAddDialogOpen(true)} className="add-custom-flavor">
            +
        </PixelButton>

        {
            isAddDialogOpen && <AddCustomFlavorDialog onUpdate={onUpdate} flavor={openCustomFlavor} onClose={() => setAddDialogOpen(false)}></AddCustomFlavorDialog>
        }
    </div>

}