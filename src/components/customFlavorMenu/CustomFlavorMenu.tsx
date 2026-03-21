import { useState } from "react";
import { useCustomFlavors } from "../../contexts/CustomFlavors";
import { useGameState } from "../../contexts/GameStateContext";
import AddCustomFlavorDialog from "../addCustomFlavor/AddCustomFlavorDialog";
import PixelButton from "../pixelDiv/PixelButton";
import CustomFlavorItem from "./CustomFlavorItem";
import "./CustomFlavorMenu.scss";
import { deleteCustomFlavor, updateCustomFlavor, type CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";
import CustomFlavorServerManager from "./CustomFlavorServerManager";
import { useUser } from "../../contexts/UserContext";
import Utils from "../../utils/Utils";
import CustomFlavorPreview from "./CustomFlavorPreview";

export default function CustomFlavorMenu() {

    const gameState = useGameState();
    const customFlavors = useCustomFlavors();
    const [isAddDialogOpen, setAddDialogOpen] = useState<boolean>(false);
    const [openCustomFlavor, setOpenCustomFlavor] = useState<CustomFlavor | null>(null);
    const [currentPreviewing, setCurrentPreviewing] = useState<CustomFlavor | null>(null);
    const user = useUser();

    const onEdit = (customFlavor: CustomFlavor) => {
        setOpenCustomFlavor(customFlavor);
        setAddDialogOpen(true);
    };

    const onDelete = (customFlavor: CustomFlavor) => {
        deleteCustomFlavor(customFlavor, customFlavors);
        if (user.user) CustomFlavorServerManager.removeCustomFlavor(user.user, customFlavor.uuid).then(e => e && Utils.success("Successfully deleted custom flavor"));
    }


    const onUpdate = (audio: string, image: string, colors: [string, string, string], name: string) => {
        if (!openCustomFlavor) return;
        const newCustomFlavor = {
            audio,
            image,
            colors,
            name,
            isPublic: false,
            uuid: openCustomFlavor.uuid
        };
        updateCustomFlavor(user.user, newCustomFlavor, customFlavors);
        if (user.user) CustomFlavorServerManager.updateCustomFlavor(user.user, newCustomFlavor).then(e => e && Utils.success("Successfully updated custom flavor"));
    }

    const changeVisibility = (is: boolean, flavor: CustomFlavor) => {
        if (user.user) CustomFlavorServerManager.updateVisibility(user.user, flavor.uuid, is).then(e => e && Utils.success(`Successfully chnaged visibility to ${is ? "public" : "private"}`));
    }

    const preview = (flavor: CustomFlavor) => {
        setCurrentPreviewing(flavor);
    }

    return <div className="custom-flavor-menu">
        <h1>Custom Flavors</h1>
        <button className="close" onClick={() => gameState.goBack()}>x</button>

        <ul className="custom-flavor-list">
            {
                customFlavors.customFlavors.map(flavor => <CustomFlavorItem key={flavor.name} preview={() => preview(flavor)} isPublic={flavor.isPublic} onChangeVisibility={(is) => changeVisibility(is, flavor)} onDelete={() => onDelete(flavor)} onEdit={() => onEdit(flavor)} flavor={flavor} />)
            }
        </ul>

        <PixelButton max-pixel-width={10} onClick={() => setAddDialogOpen(true)} className="add-custom-flavor">
            +
        </PixelButton>

        {
            currentPreviewing && <CustomFlavorPreview flavor={currentPreviewing} onClose={() => setCurrentPreviewing(null)}></CustomFlavorPreview>
        }

        {
            isAddDialogOpen && <AddCustomFlavorDialog onUpdate={onUpdate} flavor={openCustomFlavor} onClose={() => setAddDialogOpen(false)}></AddCustomFlavorDialog>
        }
    </div>

}