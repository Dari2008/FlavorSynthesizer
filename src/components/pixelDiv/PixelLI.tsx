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

import { useEffect, useRef, type DetailedHTMLProps, type HTMLAttributes, type ReactNode } from "react";
import "./PixelDiv.scss";

type PixelDivType = DetailedHTMLProps<HTMLAttributes<HTMLLIElement>, HTMLLIElement> & { children?: ReactNode; "max-pixel-width"?: number; };

export default function PixelLI({ children, ...rest }: PixelDivType) {
    rest.className = (rest.className ? rest.className : "") + " pixel-div";
    const originalFunction = rest.ref;
    const divRef = useRef<HTMLLIElement>(null);
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
        }
    }

    useEffect(() => {
        const div = divRef.current;
        if (!div) return;

        const setSize = () => {
            const box = div.getBoundingClientRect();
            div.style.setProperty("--width", box.width + "px");
            div.style.setProperty("--height", box.height + "px");
        }

        const resizeListener = new ResizeObserver(() => {
            setSize();
        });
        resizeListener.observe(div);

        div.addEventListener("resize", () => {
            setSize();
        });
        setSize();

    }, [divRef.current]);

    return <li {...rest} >
        {/* <div className="left"></div>
        <div className="center"></div>
        <div className="right"></div> */}
        {children}
    </li>
}