import Text from "../../components/text/Text";
import { useTutorials } from "../../context/TutorialContext";
import { TutorialProgressContext } from "../../context/TutorialProgressContext";
import { useTutorialSteps } from "../../hooks/TutorialStepHook";

export default function ShareTutorial() {

    const tutorials = useTutorials();

    const steps = useTutorialSteps([
        "initial",
        "firstDecide",
        "setFlavorCombo"
    ], tutorials.finishedTutorial);


    return <TutorialProgressContext.Provider value={{ ...steps, title: "Select Main Flavor Tutorial" }}>
        <div className="tutorial share-tutorial">
            {
                (() => {
                    switch (steps.step) {
                        case "initial":
                            return <Text text="Here you can share your dish with other users." />

                        case "firstDecide":
                            return <Text text="If you are not logged in, you can 9either log in or share the dish anyway. However, sharing it without logging in means you will not be able to update it later. Logging in also gives you one AI-generated image that matches your dish. You can share your dish using a code, a flavor combination, an AI-generated image, or a URL." />
                        case "setFlavorCombo":
                            return <Text text="First, choose the flavor combination you want to share with others. The rest will be generated automatically. Image generation may take a minute or two." />
                    }
                })()
            }
        </div>
    </TutorialProgressContext.Provider>;
}