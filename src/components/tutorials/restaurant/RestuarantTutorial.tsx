import Text from "../components/text/Text";
import { useTutorials } from "../context/TutorialContext";
import { TutorialProgressContext } from "../context/TutorialProgressContext";
import { useTutorialSteps } from "../hooks/TutorialStepHook";
import "./RestuarantTutorial.scss";

export default function RestaurantTutorial() {
    const tutorialSteps = useTutorialSteps([
        "initial",
        "play"
    ], finished);

    const tutorials = useTutorials();

    function finished() {
        tutorials.finishedTutorial();
    }

    return <TutorialProgressContext.Provider value={{ ...tutorialSteps, title: "Restaurant Tutorial" }}>
        <div className="tutorial restaurant-tutorial">
            {
                (() => {
                    switch (tutorialSteps.step) {
                        case "initial":
                            return <Text text="This is where you can view all published dishes." />
                        case "play":
                            return <Text text={<>By pressing the play button (<img className="play-inline" src="./imgs/actionButtons/dishList/play.png" />), you can view the generated image, along with information about when it was created and who created it.</>} />
                    }
                    return undefined;
                })()
            }
        </div>
    </TutorialProgressContext.Provider>
}