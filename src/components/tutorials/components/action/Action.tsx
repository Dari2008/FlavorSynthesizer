import { useState, type HTMLAttributes, type ReactNode } from "react";
import "./Action.scss";
import { useTutorialProgress } from "../../context/TutorialProgressContext";
import PixelDiv from "../../../pixelDiv/PixelDiv";

type ActionProps = HTMLAttributes<HTMLDivElement> & {
    text: ReactNode;
    callbackRefOnAction: React.RefObject<() => void>;
}

export default function Action(props: ActionProps) {
    const progress = useTutorialProgress();

    const [canContinue, setCanContinue] = useState<boolean>(false);
    const callbackRefOnAction = props.callbackRefOnAction;

    callbackRefOnAction.current = () => {
        setCanContinue(true);
    };

    return <PixelDiv max-pixel-width={40} {...{ ...props, subtitle: undefined, title: undefined, image: undefined, className: (props.className ?? "") + " tutorial-text" }}>
        <div className="progress">
            {`${progress.currentStep + 1} / ${progress.maxSteps}`}
        </div>
        <div className="content">
            <h2>{progress.title}</h2>
            <span className="text">{props.text}</span>
        </div>
        <div className="buttons">
            {
                progress.isFinished
                &&
                <button className="finish" data-disabled={canContinue} onClick={() => canContinue && progress.finish()}>
                    <img src="./imgs/tutorial/actions/finish.png" alt="Finish" />
                </button>
                ||
                <button className="next" data-disabled={canContinue} onClick={() => canContinue && progress.next()}>
                    <img src="./imgs/tutorial/actions/next.png" alt="Next" />
                </button>
            }
            {
                progress.currentStep !== 0 && <button className="prev" onClick={() => progress.prev()}>
                    <img src="./imgs/tutorial/actions/prev.png" alt="Previous" />
                </button>
            }
        </div>
    </PixelDiv>

}