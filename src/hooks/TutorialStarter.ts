import { useEffect } from "react";
import { useTutorials } from "../components/tutorials/context/TutorialContext";
import type { TutorialAction } from "../components/tutorials/Tutorials";

export default function withTutorialStarter(tutorial: TutorialAction) {
    const tutorials = useTutorials();
    useEffect(() => {
        if (tutorials.isTutorialFinished(tutorial)) return;
        tutorials.onAction(tutorial);
    }, [tutorial]);
}