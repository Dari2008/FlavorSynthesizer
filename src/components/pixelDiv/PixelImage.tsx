
import { useEffect, useRef, type DetailedHTMLProps, type ImgHTMLAttributes } from "react";

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
        setSize();
    }, [divRef.current]);

    return <img {...rest} />
}