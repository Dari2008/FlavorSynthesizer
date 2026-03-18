// import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
// import "./PixelDiv.scss";

// type PixelDivType = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & { children?: ReactNode; bgColor: string };

// export default function PixelDiv({ children, bgColor, ...rest }: PixelDivType) {
//     rest.className = (rest.className ? rest.className : "") + " pixel-div";
//     rest.style = { ...rest.style ? rest.style : {}, "--bg-color": bgColor } as any;
//     return <div {...rest}>
//         <div className="left"></div>
//         <div className="center"></div>
//         <div className="right"></div>
//         {children}
//     </div>
// }

import { useRef, type DetailedHTMLProps, type ReactNode } from "react";
import "./PixelButton.scss";
import BGBorderDiv from "./BGBorderDivType";

type PixelButtonType = DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & { children?: ReactNode[] | ReactNode; "max-pixel-width"?: number; };

export default function PixelButton({ children, ...rest }: PixelButtonType) {
    rest.className = (rest.className ? rest.className : "") + " pixel-div pixel-button";
    const originalFunction = rest.ref;
    const divRef = useRef<HTMLButtonElement>(null);
    rest.ref = (r) => {
        if (originalFunction !== undefined) {
            if (typeof originalFunction === "function") {
                originalFunction?.(r);
            } else {
                if (!!originalFunction) {
                    originalFunction.current = r;
                }
            }
        }
        divRef.current = r;

        if (r && rest["max-pixel-width"]) {
            r.style.setProperty("--max-pixel-width", rest["max-pixel-width"] + "px");
        } else if (r) {
            r.style.setProperty("--max-pixel-width", "30px");
        }
    }

    return <button {...rest} >
        <BGBorderDiv className="bg"></BGBorderDiv>
        {/* <div className="left"></div>
        <div className="center"></div>
        <div className="right"></div> */}
        {children}
    </button>
}