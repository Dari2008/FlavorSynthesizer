import { useState } from "react";
import "./InitialMenu.scss";

export default function InitialMenu({ openStateChanged }: { openStateChanged: (element: SelectableElement) => void }) {

    const [selectedElement, setSelectedElement] = useState<SelectableElement>("none");

    const clicked = (element: SelectableElement) => {
        setSelectedElement(element);
        setTimeout(() => openStateChanged(element), 300);
    };

    return <div className="main-menu">
        <div className="user-profile">
            <img src="./mainMenu/user-profile.png" alt="Image of chefs hat" />
        </div>
        <div className="options">
            <button className={"add-dish" + (selectedElement == "add" ? " selected" : "")} onClick={() => clicked("add")}>
                <img src="./mainMenu/add-dish.png" alt="A Bowl with a plus" />
                <span className="label">Create a dish</span>
            </button>
            <button className={"list-dish" + (selectedElement == "list" ? " selected" : "")} onClick={() => clicked("list")}>
                <img src="./mainMenu/dish-list.png" alt="A list with entrys" />
                <span className="label">View saved dishes</span>
            </button>
            <button className={"open-dish-list" + (selectedElement == "open" ? " selected" : "")} onClick={() => clicked("open")}>
                <img src="./mainMenu/open-shared-dish.png" alt="A pot with the lid levetating above it" />
                <span className="label">Open a shared dish</span>
            </button>
        </div>
    </div>;
}

export type SelectableElement = "add" | "open" | "list" | "none";