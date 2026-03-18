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
import "./PixelInput.scss";

type PixelDivType = DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & { children?: ReactNode[] | ReactNode; "max-pixel-width"?: number };

export default function PixelInput({ children, ...rest }: PixelDivType) {
    rest.className = (rest.className ? rest.className : "") + " pixel-div pixel-input";
    const originalFunction = rest.ref;
    const divRef = useRef<HTMLInputElement>(null);
    rest.ref = (r) => {
        if (originalFunction !== undefined) {
            if (typeof originalFunction == "function") {
                originalFunction?.(r);
            } else {
                if (originalFunction) originalFunction.current = r;
            }
        }
        divRef.current = r;

        if (r && rest["max-pixel-width"]) {
            r.style.setProperty("--max-pixel-width", rest["max-pixel-width"] + "px");
        } else if (r) {
            r.style.setProperty("--max-pixel-width", "30px");
        }
    }

    return <input {...rest}></input>
}