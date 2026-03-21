import { useEffect, useRef } from "react";
import { CUSTOM_FLAVORS_RENDERERS, type CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";
import { _drawElement, FLAVOR_HEIGHT } from "../FlavorUtils";
import type { Flavor } from "../../@types/Flavors";
import PixelDivWBorder from "../pixelDiv/PixelDivWBorder";

export default function CustomFlavorPreview({ flavor, onClose }: { flavor: CustomFlavor; onClose: () => void; }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const width = 300;
    const len = 10;
    const pixelsPerSecond = width / len;

    const render = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d")!;
        if (!ctx) return;

        const renderer = CUSTOM_FLAVORS_RENDERERS.find(e => e.uuid == flavor.uuid);
        if (!renderer) {
            console.error("Couldn't find renderer", CUSTOM_FLAVORS_RENDERERS);
            return;
        }

        _drawElement({
            flavor: flavor.name as Flavor,
            from: 0,
            to: 10,
            uuid: flavor.uuid
        }, renderer, ctx, pixelsPerSecond, 0, 0, false, false);
    };

    useEffect(() => {
        render();

    }, [canvasRef.current]);

    return <div className="custom-flavor-preview-wrapper">
        <div className="bg"></div>
        <PixelDivWBorder max-pixel-width={25} className="custom-flavor-preview">
            <button className="close" onClick={onClose}>x</button>
            <h2>Preview</h2>
            <canvas width={width} height={FLAVOR_HEIGHT} ref={(e) => { canvasRef.current = e; render(); }}></canvas>
        </PixelDivWBorder>
    </div>
}