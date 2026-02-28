import type { ReactNode } from "react";
import "./ScrollingBackgroundImage.scss";

export default function ScrollingBackgrundImage(
    {
        images,
        children,
        aspectRatios
    }:
        {
            images: {
                top: string;
                middle: string;
                bottom: string;
            },
            aspectRatios: {
                top: string;
                middle?: string;
                bottom: string;
            }
            children: [ReactNode, ReactNode, ReactNode] | ReactNode[]
        }
) {

    const contentTop = children[0];
    const contentMiddle = children[1];
    const contentBottom = children[2];
    const rest = children.slice(2);

    return <div className="background-scrolling-image">
        <div className="top" style={{ "--image": `url(${images.top})`, aspectRatio: aspectRatios.top } as any}>
            {
                contentTop
            }
        </div>
        <div className="middle" style={{ "--image": `url(${images.middle})`, aspectRatio: aspectRatios.middle } as any}>
            {
                contentMiddle
            }
        </div>
        <div className="bottom" style={{ "--image": `url(${images.bottom})`, aspectRatio: aspectRatios.bottom } as any}>
            {
                contentBottom
            }
        </div>
        {
            ...rest
        }
    </div>
}