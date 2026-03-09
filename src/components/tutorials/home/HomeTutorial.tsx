import Text from "../components/text/Text";
import { useTutorials } from "../context/TutorialContext";
import { TutorialProgressContext } from "../context/TutorialProgressContext";
import { useTutorialSteps } from "../hooks/TutorialStepHook";

export default function HomeTutorial() {

    const tutorials = useTutorials();

    const steps = useTutorialSteps([
        "initial"
    ], tutorials.finishedTutorial);


    return <TutorialProgressContext.Provider value={{ ...steps, title: "Select Main Flavor Tutorial" }}>
        <div className="tutorial home-tutorial">
            <Text text={
                <>
                    This is the main menu. From here you can go to:
                    <ul style={{ textAlign: "left" }}>
                        <li>Restaurant (View all published dishes)</li>
                        <li>Create a Dish</li>
                        <li>Open a shared Dish</li>
                        <li>Dish List (view all cooked dishes)</li>
                    </ul>
                </>
            } />
        </div>
    </TutorialProgressContext.Provider>;
}