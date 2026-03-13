import Image from "../../components/image/Image";
import Text from "../../components/text/Text";
import { useTutorials } from "../../context/TutorialContext";
import { TutorialProgressContext } from "../../context/TutorialProgressContext";
import { useTutorialSteps } from "../../hooks/TutorialStepHook";
import "./IntitialLandingEditorTutorial.scss";

export default function IntitialLandingEditorTutorial() {
    const tutorialSteps = useTutorialSteps([
        "initial",
        "playPauseSkip",
        "volumes",
        "addSynthLine",
        "statistic",
        "save",
        "share",
        "openMultiplayer",
        "changeMainFlavor",
        "changeName",
        "flavorList"
    ], finished);

    const tutorials = useTutorials();

    function finished() {
        tutorials.finishedTutorial();
    }

    return <TutorialProgressContext.Provider value={{ ...tutorialSteps, title: "Editor Tutorial" }}>
        <div className="tutorial initial-landing-editor-tutorial">
            {
                (() => {
                    switch (tutorialSteps.step) {
                        case "initial":
                            return <Text text="This is the editor where you create your dishes." />

                        case "playPauseSkip":
                            return <Image
                                className="small-image"
                                image="./imgs/tutorial/editor/controls.png"
                                subtitle="At the bottom are the playback controls for play/pause and skipping forward or backward."
                            />

                        case "volumes":
                            return <Image
                                className="small-image"
                                image="./imgs/tutorial/editor/volumes.png"
                                subtitle="To the left of the controls are the volume knobs. Drag them in a circle to adjust the volume, or click the number to enter a value."
                            />

                        case "addSynthLine":
                            return <Image
                                className="small-image"
                                image="./imgs/tutorial/editor/addSynthLine.png"
                                subtitle="Below the dish name is a plus button. Use it to add tracks so multiple flavors can play at once."
                            />

                        case "statistic":
                            return <Image
                                className="small-image"
                                image="./imgs/tutorial/editor/statistics.png"
                                subtitle="Here you can see statistics about your dish, such as how many flavors play at once and how many you have used in total."
                            />

                        case "save":
                            return <Text text={
                                <>
                                    At the bottom are two buttons. The lower one (<img src="./imgs/actionButtons/save.png" className="inline-image" />) saves your dish. Your dish is also saved automatically every minute.
                                </>
                            } />

                        case "share":
                            return <Text text={
                                <>
                                    The Share button (<img src="./imgs/actionButtons/share.png" className="inline-image" />) above the Save button lets you share your dish with other users.
                                </>
                            } />

                        case "openMultiplayer":
                            return <Text text={
                                <>
                                    the button right (<img src="./imgs/actionButtons/save.png" className="inline-image" />) opens your dish as a multiplayer that means other people can join your "meeeting" and edit the same dish live.
                                </>
                            } />

                        case "changeMainFlavor":
                            return <Image
                                className="small-image"
                                image="./imgs/tutorial/editor/mainFlavorSelector.png"
                                subtitle="In the top-left corner you can see the current main flavor. Click it to change it."
                            />

                        case "changeName":
                            return <Text text="At the top is the dish name. Click it to rename your dish." />

                        case "flavorList":
                            return <Image
                                image="./imgs/tutorial/editor/flavorList.png"
                                subtitle="On the right is the flavor list. Drag and drop flavors from here into the timeline."
                            />
                    }
                    return undefined;
                })()
            }
        </div>
    </TutorialProgressContext.Provider>
}