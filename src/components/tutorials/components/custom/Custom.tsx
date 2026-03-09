import { type HTMLAttributes, type ReactNode } from "react";
import "./Custom.scss";
import { useTutorialProgress } from "../../context/TutorialProgressContext";
import PixelDiv from "../../../pixelDiv/PixelDiv";

type CustomProps = HTMLAttributes<HTMLDivElement> & {
    text: ReactNode;
    element: ReactNode;
}

export default function Custom(props: CustomProps) {
    const progress = useTutorialProgress();

    return <PixelDiv max-pixel-width={40} {...{ ...props, subtitle: undefined, title: undefined, element: undefined, text: undefined, className: (props.className ?? "") + " tutorial-custom" }}>
        <div className="progress">
            {`${progress.currentStep + 1} / ${progress.maxSteps}`}
        </div>
        <div className="content">
            <h2>{progress.title}</h2>
            <div className="custom-content">
                {props.element}
            </div>
            <span className="text">{props.text}</span>
        </div>
        <div className="buttons">
            {
                progress.isFinished
                &&
                <button className="finish" onClick={() => progress.finish()}>
                    <img src="./imgs/tutorial/actions/finish.png" alt="Finish" />
                </button>
                ||
                <button className="next" onClick={() => progress.next()}>
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