import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import "./PixelDiv.scss";

type PixelDivType = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & { children?: ReactNode; bgColor: string };

export default function PixelDiv({ children, bgColor, ...rest }: PixelDivType) {
    rest.className = (rest.className ? rest.className : "") + " pixel-div";
    rest.style = { ...rest.style ? rest.style : {}, "--bg-color": bgColor } as any;
    return <div {...rest}>
        <div className="left"></div>
        <div className="center"></div>
        <div className="right"></div>
        {children}
    </div>
}