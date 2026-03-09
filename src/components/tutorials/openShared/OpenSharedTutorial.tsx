import Image from "../components/image/Image";
import Text from "../components/text/Text";
import { useTutorials } from "../context/TutorialContext";
import { TutorialProgressContext } from "../context/TutorialProgressContext";
import { useTutorialSteps } from "../hooks/TutorialStepHook";

export default function OpenSharedTutorial() {
    const tutorialSteps = useTutorialSteps([
        "initial",
        "flavorCombo",
        "code"
    ], finished);

    const tutorials = useTutorials();

    function finished() {
        tutorials.finishedTutorial();
    }

    return <TutorialProgressContext.Provider value={{ ...tutorialSteps, title: "Opening a Shared Dish Tutorial" }}>
        <div className="tutorial restaurant-tutorial">
            {
                (() => {
                    switch (tutorialSteps.step) {
                        case "initial":
                            return <Text text="This is where you can open a shared dish by entering the code, flavor combo or uploading the projects image." />
                        case "flavorCombo":
                            return <Image image="./imgs/tutorial/openSharedTutorial/enterFlavorCombo.png" subtitle="To enter a flavor combo drag & drop the flavors from the list on the right." />
                        case "code":
                            return <Image image="./imgs/tutorial/openSharedTutorial/enterCode.png" subtitle="To enter a code you can either paste it (CTRL+V) or type it manually." />
                    }
                    return undefined;
                })()
            }
        </div>
    </TutorialProgressContext.Provider>
}