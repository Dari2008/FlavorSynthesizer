
import { useRef, type DetailedHTMLProps, type ImgHTMLAttributes } from "react";

type PixelImageProps = DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & { "max-pixel-width"?: number; };

export default function PixelImage({ ...rest }: PixelImageProps) {
    rest.className = (rest.className ? rest.className : "") + " pixel-div pixel-image";
    const originalFunction = rest.ref;
    const divRef = useRef<HTMLImageElement>(null);

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

    return <img {...rest} />
}