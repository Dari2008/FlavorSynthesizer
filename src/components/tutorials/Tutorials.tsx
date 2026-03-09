import { useState, type ReactNode } from "react";
import DishListTutorial from "./dishList/DishListTutorial";
import EditorTutorialManager, { type EditorTutorialManagerSelection } from "./editor/EditorTutorialManager";
import HomeTutorial from "./home/HomeTutorial";
import OpenSharedTutorial from "./openShared/OpenSharedTutorial";
import { TutorialContext } from "./context/TutorialContext";
import RestaurantTutorial from "./restaurant/RestuarantTutorial";
import SelectMainFlavorTutorial from "./editor/selectMainFlavor/SelectMainFlavorTutorial";

export default function Tutorials({ children, startTutorialRef }: { children: ReactNode; startTutorialRef: React.RefObject<((tutorial: TutorialAction) => void) | null>; }) {
    const [currentTutorial, setCurrentTutorial] = useState<TutorialAction | null>(null);
    const tutorialsAllreadyAbsolved = getTutorialsAllreadyAbsolved();

    const startTutorial = (tutorial: TutorialAction) => {
        if (currentTutorial == tutorial) return;
        if (isTutorialFinished(tutorial)) {
            return;
        }
        tutorialsAllreadyAbsolved.push(tutorial);
        setCurrentTutorial(tutorial);
        setTutorialsAllreadyAbsolved(tutorialsAllreadyAbsolved);
    };

    startTutorialRef.current = startTutorial;

    const finishedTutorial = () => {
        setCurrentTutorial(null);
    };

    const isTutorialFinished = (action: TutorialAction) => {
        return tutorialsAllreadyAbsolved.includes(action as TutorialAction);
    };

    const onAction = (action: TutorialAction) => {
        startTutorial(action);
    };

    return <TutorialContext.Provider value={{ startTutorial, onAction, isTutorialFinished, finishedTutorial }}>

        {children}
        {
            currentTutorial == "openedDishList" && <DishListTutorial />
        }

        {
            currentTutorial?.startsWith("editor-") && <EditorTutorialManager currentSelected={currentTutorial as EditorTutorialManagerSelection} />
        }

        {
            currentTutorial == "openedCreate" && <SelectMainFlavorTutorial />
        }

        {
            currentTutorial == "home" && <HomeTutorial />
        }

        {
            currentTutorial == "openedOpenShare" && <OpenSharedTutorial />
        }

        {
            currentTutorial == "openedRestaurant" && <RestaurantTutorial />
        }

    </TutorialContext.Provider>;
}

export type TutorialAction = "home" | "openedRestaurant" | "openedDishList" | "openedOpenShare" | "openedCreate" | EditorTutorialManagerSelection;

function getTutorialsAllreadyAbsolved(): TutorialAction[] {
    const raw = localStorage.getItem("tutorialsAbsolved");
    if (!raw) return [];
    const data = JSON.parse(raw) as TutorialAction[];
    return data;
}

function setTutorialsAllreadyAbsolved(tutorials: TutorialAction[]) {
    localStorage.setItem("tutorialsAbsolved", JSON.stringify(tutorials));
}