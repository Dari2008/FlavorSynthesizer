import { useTouchChecker } from "../../../../contexts/TouchCheckerContext";
import Image from "../../components/image/Image";
import Text from "../../components/text/Text";
import { useTutorials } from "../../context/TutorialContext";
import { TutorialProgressContext } from "../../context/TutorialProgressContext";
import { useTutorialSteps } from "../../hooks/TutorialStepHook";

export default function SynthLineTutorial() {
    const tutorialSteps = useTutorialSteps([
        "initial",
        "timeline-actions",
        "zoom-timeline",
        "move-timeline",
        "set-playback-cursor",
        "move-flavor",
        "resize-flavor",
        "select-flavor"
    ], finished);

    const tutorials = useTutorials();

    function finished() {
        tutorials.finishedTutorial();
    }

    const isTouch = useTouchChecker().isTouch;

    return <TutorialProgressContext.Provider value={{ ...tutorialSteps, title: "Editor Tutorial" }}>
        <div className="tutorial initial-landing-editor-tutorial">
            {
                (() => {
                    switch (tutorialSteps.step) {
                        case "initial":
                            return <Text text="This is a timeline where you can place and arrange flavors." />

                        case "timeline-actions":
                            return <Image
                                className="small-image"
                                image="./imgs/tutorial/timeline/controls.png"
                                subtitle={
                                    <>
                                        On the left of each timeline is a control panel where you can:
                                        <ul style={{ textAlign: "left" }}>
                                            <li>Mute the timeline</li>
                                            <li>Solo it (only this timeline will play)</li>
                                            <li>Remove the timeline</li>
                                        </ul>
                                    </>
                                }
                            />

                        case "zoom-timeline":
                            return <Image
                                image="./imgs/tutorial/timeline/zoom-timeline.png"
                                subtitle={
                                    isTouch
                                        ? "Pinch on the timeline to zoom in or out."
                                        : "Hold CTRL and scroll on the timeline to zoom in or out."
                                }
                            />

                        case "move-timeline":
                            return <Image
                                image="./imgs/tutorial/timeline/move-timeline.png"
                                subtitle={
                                    isTouch
                                        ? "Drag on the timeline to move the visible time frame."
                                        : "Hold Shift and scroll to move the visible time frame."
                                }
                            />

                        case "set-playback-cursor":
                            return <Image
                                image="./imgs/tutorial/timeline/set-playback-cursor.png"
                                subtitle={
                                    isTouch
                                        ? "Tap the timeline to set the playback cursor."
                                        : "Click the timeline to set the playback cursor."
                                }
                            />

                        case "move-flavor":
                            return <Image
                                image="./imgs/tutorial/timeline/move-flavor.png"
                                subtitle="Drag a flavor to move it. You can also move it between tracks."
                            />

                        case "resize-flavor":
                            return <Image
                                image="./imgs/tutorial/timeline/resize-flavor.png"
                                subtitle="Drag the edge of a flavor to resize it."
                            />

                        case "select-flavor":
                            return <Image
                                image="./imgs/tutorial/timeline/selected-flavor.png"
                                subtitle={
                                    isTouch
                                        ? "Tap a flavor to select it. Tap it again to select only that one. Long-press a flavor to open a menu where you can delete it."
                                        : "Click a flavor to select it. Hold Ctrl to select multiple flavors and move, delete, or resize them all at once."
                                }
                            />
                    }
                })()
            }
        </div>
    </TutorialProgressContext.Provider>
}