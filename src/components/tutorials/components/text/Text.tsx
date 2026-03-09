import type { HTMLAttributes, ReactNode } from "react";
import "./Text.scss";
import { useTutorialProgress } from "../../context/TutorialProgressContext";
import PixelDiv from "../../../pixelDiv/PixelDiv";
import PixelButton from "../../../pixelDiv/PixelButton";

type TextProps = HTMLAttributes<HTMLDivElement> & {
    text: ReactNode;
}

export default function Text(props: TextProps) {
    const progress = useTutorialProgress();
    return <PixelDiv max-pixel-width={40} {...{ ...props, className: (props.className ?? "") + " tutorial-text", text: undefined }}>
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