import dayjs from "dayjs";
import { useGameState } from "../../../contexts/GameStateContext";
import { useTouchChecker } from "../../../contexts/TouchCheckerContext";
import DishListItem from "../../dishList/DishListItem";
import Custom from "../components/custom/Custom";
import Text from "../components/text/Text";
import { TutorialProgressContext } from "../context/TutorialProgressContext";
import { useTutorialSteps } from "../hooks/TutorialStepHook";
import "./DishListTutorial.scss";
import { DATE_FORMAT } from "../../../utils/Statics";
import Utils from "../../../utils/Utils";
import { useTutorials } from "../context/TutorialContext";
import Toggle from "../../toggle/Toggle";

export default function DishListTutorial() {
    const tutorialSteps = useTutorialSteps([
        "initial",
        "play",
        "menu"
    ], finished);
    const isTouch = useTouchChecker().isTouch;
    const gameState = useGameState();

    const tutorials = useTutorials();

    function finished() {
        tutorials.finishedTutorial();
    }

    return <TutorialProgressContext.Provider value={{ ...tutorialSteps, title: "Dish List Tutorial" }}>
        <div className="tutorial dishlist-tutorial">
            {
                (() => {
                    switch (tutorialSteps.step) {
                        case "initial":
                            return <>
                                <Text text="Here you can view and manage the dishes you have created." />
                            </>
                        case "play":
                            return <>
                                <Custom
                                    element={
                                        <>
                                            <DishListItem dish={{
                                                createdAt: dayjs().format(DATE_FORMAT),
                                                createdBy: "Unknown",
                                                data: [
                                                    {
                                                        elements: [
                                                            {
                                                                flavor: "Balsamic",
                                                                from: 2,
                                                                to: 8,
                                                                uuid: Utils.uuidv4()
                                                            }
                                                        ],
                                                        muted: false,
                                                        solo: false,
                                                        uuid: Utils.uuidv4(),
                                                        volume: 100
                                                    }
                                                ],
                                                customFlavors: [],
                                                mainFlavor: "Salty",
                                                name: "Test",
                                                publishState: "private",
                                                type: "dish",
                                                uuid: Utils.uuidv4(),
                                                volumes: {
                                                    flavors: 100,
                                                    mainFlavor: 100,
                                                    master: 100
                                                },
                                                share: {
                                                    aiImage: "",
                                                    code: [0, 0, 0, 0, 0, 0],
                                                    flavors: ["Almond", "Almond", "Almond", "Almond", "Almond", "Almond"]
                                                }
                                            }} playDish={() => 0} currentPlayingUUID={null}></DishListItem>
                                        </>
                                    }
                                    text={<>By clicking the Play button (<img className="play-inline" src="./imgs/actionButtons/dishList/play.png" />) you can preview the dish. <br /> {
                                        isTouch
                                            ?
                                            "You can also long-press to see the options."
                                            :
                                            "You can also right-click to see the options."
                                    }
                                    </>
                                    } />
                            </>
                        case "menu":
                            return <>
                                <Text text={
                                    <>
                                        By {
                                            isTouch
                                                ?
                                                "long pressing"
                                                :
                                                "right-clicking"
                                        } on a dish you can see these options:
                                        <ul className="tutorial-right-click-options">
                                            <li>
                                                <img src="./imgs/actionButtons/dishList/delete.png" alt="" />
                                                Delete the Dish
                                            </li>
                                            <li>
                                                <img src="./imgs/actionButtons/dishList/share.png" alt="" />
                                                Share the Dish
                                            </li>
                                            <li>
                                                <img src="./imgs/actionButtons/dishList/open.png" alt="" />
                                                Edit the Dish
                                            </li>
                                            <li>
                                                <img src="./imgs/actionButtons/dishList/download.png" alt="" />
                                                Download the Dish
                                            </li>
                                            <li>
                                                <img src="./imgs/actionButtons/dishList/duplicate.png" alt="" />
                                                Duplicate the Dish
                                            </li>
                                            <li>
                                                <Toggle checked={false} onToggleChange={() => 0}><></></Toggle>
                                                Change the visibility of your Dish. So that it can be seen in the <button className="redirect-button" onClick={() => gameState.setGameState("restaurant")}>Restaurant</button>
                                            </li>
                                        </ul>
                                    </>
                                } /></>
                    }
                    return undefined;
                })()
            }
        </div>
    </TutorialProgressContext.Provider>
}