import type { CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";
import PixelDiv from "../pixelDiv/PixelDiv";
import PixelImage from "../pixelDiv/PixelImage";
import PixelLI from "../pixelDiv/PixelLI";

export default function CustomFlavorItem({ flavor, onEdit, onDelete }: { flavor: CustomFlavor, onEdit: () => void; onDelete: () => void }) {

    return <PixelLI max-pixel-width={20} className="custom-flavor-item">

        <PixelImage max-pixel-width={10} src={flavor.image} alt={"image of " + flavor.flavorName} className="image" />

        <span className="name">{flavor.flavorName}</span>

        <div className="colors">
            {
                flavor.colors.map(color => {
                    return <PixelDiv max-pixel-width={20} className="color" style={{ "--color": color } as any}>{rgbStringToHex(color)}</PixelDiv>
                })
            }
        </div>

        <button className="edit" onClick={onEdit}>
            <img src="./imgs/actionButtons/dishList/open.png" alt="edit button" />
        </button>

        <button className="delete" onClick={onDelete}>
            <img src="./imgs/actionButtons/dishList/delete.png" alt="delete button" />
        </button>

    </PixelLI>
}

function componentToHex(value: number): string {
    const v = Math.max(0, Math.min(255, Math.round(value)));
    return v.toString(16).padStart(2, "0");
}

export function rgbStringToHex(input: string): string | null {
    const match = input
        .trim()
        .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);

    if (!match) return input.toUpperCase();

    const r = parseFloat(match[1]);
    const g = parseFloat(match[2]);
    const b = parseFloat(match[3]);
    const a = match[4] !== undefined ? parseFloat(match[4]) : undefined;

    const hex =
        `#${componentToHex(r)}` +
        `${componentToHex(g)}` +
        `${componentToHex(b)}`;

    if (a === undefined) return hex.toUpperCase();

    const alpha = Math.max(0, Math.min(1, a));
    const alphaByte = Math.round(alpha * 255);

    return (hex + componentToHex(alphaByte)).toUpperCase();
}