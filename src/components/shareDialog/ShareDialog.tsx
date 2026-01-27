import { useRef, useState } from "react";
import { FLAVOR_COLOR, FLAVOR_IMAGES, MAIN_FLAVOR_COLOR, MAIN_FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import "./ShareDialog.scss";
import { FLAVORS } from "../../audio/Flavors";

const SHARE_FLAVOR_COMBO_LENGTH = 6;
const COPY_WIDTH_PER_FLAVOR = 80;
const GAP_BETWEEN_FLAVORS = 20;

const maskImageVines = new Image();
maskImageVines.src = "./masks/background-main-flavor-vines-mask_alpha.png";

const maskImageMainVines = new Image();
maskImageMainVines.src = "./masks/background-main-flavor-main-mask_alpha.png";

export default function ShareDialog({ }: {}) {

    const [currentFlavorsSelected, setCurrentFlavorsSelected] = useState<FlavorsSelected[]>([]);
    const comboBoxRef = useRef<HTMLDivElement>(null);

    const getFlavorIndex = (index: number) => {
        return currentFlavorsSelected.find(e => e.index == index);
    };

    const setFlavor = (index: number, flavor: Flavor) => {
        const newFlavorsSelected = currentFlavorsSelected.filter(e => e.index != index);
        newFlavorsSelected.push({
            flavor: flavor,
            index: index
        });
        setCurrentFlavorsSelected([...newFlavorsSelected]);
    };


    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer) return;
        if (e.dataTransfer.getData("text/plain") && FLAVORS.map(e => e.NAME).includes(e.dataTransfer.getData("text/plain") as Flavor)) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const onDropFlavor = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer) return;
        if (e.dataTransfer.getData("text/plain") && FLAVORS.map(e => e.NAME).includes(e.dataTransfer.getData("text/plain") as Flavor)) {
            e.preventDefault();
            e.stopPropagation();
            const box = comboBoxRef.current?.getBoundingClientRect();
            if (!box) return;
            const x = e.clientX - box?.left;
            const width = box.width;

            const singleFlavorWidth = width / 6;

            const part = Math.floor(x / singleFlavorWidth);


            const flavorName = e.dataTransfer.getData("text/plain") as Flavor;
            setFlavor(part, flavorName);
            console.log(`Set ${part} to ${flavorName}`);
        }
    };

    return <div className="share-dialog-wrapper">
        <div role="dialog" className="share-dialog">

            <h1>Share</h1>

            <div className="share-flavors">
                <h2>Share Flavor</h2>
                <span>Share your dish with a flavor combo to match. Drag and drop flavors from the list to the side.</span>

                <div className="combo" onDragOver={onDragOver} onDrop={onDropFlavor} ref={comboBoxRef}>
                    {
                        Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                            const name = getFlavorIndex(i);
                            if (!name) {
                                return <div className="share-flavors-flavor-no-selected">
                                    <div className="bgImage main-color"></div>
                                    <div className="bgImage main-color-2"></div>
                                    Drag a flavor here
                                </div>;
                            }

                            return <div key={i} className="share-flavors-flavor">
                                <div className="bgImage main-color" style={{ "--main-color": FLAVOR_COLOR[name.flavor][0] } as any}></div>
                                <div className="bgImage main-color-2" style={{ "--vine-color": FLAVOR_COLOR[name.flavor].at(-1) } as any}></div>
                                <img src={FLAVOR_IMAGES[name.flavor]} alt={name.flavor} className="flavor-image" />
                            </div>
                        })
                    }
                </div>

                <div className="buttons">
                    <button className="copy-as-text">Copy as Text</button>
                    <button className="copy-as-image" onClick={(e) => {
                        copyImageOfFlavors(currentFlavorsSelected);
                        if (e.target instanceof HTMLButtonElement) {
                            (e.target as HTMLButtonElement).textContent = "Copied!";
                            setTimeout(() => {
                                (e.target as HTMLButtonElement).textContent = "Copy as image";
                            }, 2000);
                        }
                    }}>Copy as image</button>
                </div>

            </div>

            <div className="share-image"></div>
            <div className="share-code"></div>
            <div className="share-qr-code"></div>
            <div className="share-url"></div>

            <div className="buttons">
                <button className="close">X</button>
            </div>

        </div>
    </div>;
}

type FlavorsSelected = {
    flavor: Flavor;
    index: number;
};

async function copyImageOfFlavors(flavors: FlavorsSelected[]) {
    const canvas = new OffscreenCanvas(COPY_WIDTH_PER_FLAVOR * SHARE_FLAVOR_COMBO_LENGTH + GAP_BETWEEN_FLAVORS * SHARE_FLAVOR_COMBO_LENGTH + GAP_BETWEEN_FLAVORS, COPY_WIDTH_PER_FLAVOR + GAP_BETWEEN_FLAVORS * 2);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const allImagePromises: Promise<void>[] = [];

    flavors.forEach((flavor, index) => {
        allImagePromises.push(new Promise<void>((res) => {
            const img = new Image();
            img.src = FLAVOR_IMAGES[flavor.flavor];
            img.onload = () => {
                const x = index * COPY_WIDTH_PER_FLAVOR + GAP_BETWEEN_FLAVORS * index + GAP_BETWEEN_FLAVORS;
                const imgWidth = COPY_WIDTH_PER_FLAVOR * 0.6;
                const margin = COPY_WIDTH_PER_FLAVOR - imgWidth;

                fillWithMask(maskImageMainVines, FLAVOR_COLOR[flavor.flavor][0], x, GAP_BETWEEN_FLAVORS, COPY_WIDTH_PER_FLAVOR, COPY_WIDTH_PER_FLAVOR);
                fillWithMask(maskImageVines, FLAVOR_COLOR[flavor.flavor].at(-1)!, x, GAP_BETWEEN_FLAVORS, COPY_WIDTH_PER_FLAVOR, COPY_WIDTH_PER_FLAVOR);

                ctx.drawImage(img, x + margin / 2, margin / 2 + GAP_BETWEEN_FLAVORS, imgWidth, imgWidth);
                res();
            };
        }));
    });


    await Promise.all(allImagePromises);

    const blob = await canvas.convertToBlob();
    navigator.clipboard.write([
        new ClipboardItem({
            'image/png': blob
        })
    ])


    function fillWithMask(
        mask: HTMLImageElement,
        color: string,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        const temp = new OffscreenCanvas(w, h);
        const tctx = temp.getContext('2d')!;

        tctx.drawImage(mask, 0, 0, w, h);
        tctx.globalCompositeOperation = 'source-in';
        tctx.fillStyle = color;
        tctx.fillRect(0, 0, w, h);

        ctx?.drawImage(temp, x, y);
    }

}