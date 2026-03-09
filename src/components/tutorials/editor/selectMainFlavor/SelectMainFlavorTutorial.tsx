import Text from "../../components/text/Text";
import { useTutorials } from "../../context/TutorialContext";
import { TutorialProgressContext } from "../../context/TutorialProgressContext";
import { useTutorialSteps } from "../../hooks/TutorialStepHook";

export default function SelectMainFlavorTutorial() {

    const tutorials = useTutorials();

    const steps = useTutorialSteps([
        "initial"
    ], tutorials.finishedTutorial);


    return <TutorialProgressContext.Provider value={{ ...steps, title: "Select Main Flavor Tutorial" }}>
        <div className="tutorial select-main-flavor-tutorial">
            <Text text='Here you can choose the flavor, or “theme,” of your dish.' />
        </div>
    </TutorialProgressContext.Provider>;
}