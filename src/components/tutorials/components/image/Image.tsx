import type { HTMLAttributes, ReactNode } from "react";
import "./Image.scss";
import { useTutorialProgress } from "../../context/TutorialProgressContext";
import PixelDiv from "../../../pixelDiv/PixelDiv";
import PixelImage from "../../../pixelDiv/PixelImage";

type ImageProps = HTMLAttributes<HTMLDivElement> & {
    subtitle: ReactNode;
    image: string | ReactNode;
}

export default function Image(props: ImageProps) {
    const progress = useTutorialProgress();

    return <PixelDiv max-pixel-width={40} {...{ ...props, subtitle: undefined, title: undefined, image: undefined, className: (props.className ?? "") + " tutorial-image" }}>
        <button className="close" onClick={() => progress.skip()}>x</button>
        <div className="progress">
            {`${progress.currentStep + 1} / ${progress.maxSteps}`}
        </div>
        <div className="content">
            <h2>{progress.title}</h2>
            <div className="image">{typeof props.image == "string" ? <PixelImage src={props.image} alt="" /> : props.image}</div>
            <span className="subtitle">{props.subtitle}</span>
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