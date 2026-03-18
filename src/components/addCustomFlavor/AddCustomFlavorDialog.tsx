import { useEffect, useRef, useState } from "react";
import PixelButton from "../pixelDiv/PixelButton";
import PixelInput from "../pixelDiv/PixelInput";
import "./AddCustomFlavorDialog.scss";
import PixelDivWBorder from "../pixelDiv/PixelDivWBorder";
import Utils from "../../utils/Utils";
import { RgbaColorPicker, type RgbaColor } from "react-colorful";
import { addCustomFlavor, type CustomFlavor } from "./CustomFlavorManager";
import { useCustomFlavors } from "../../contexts/CustomFlavors";

export default function AddCustomFlavorDialog({ onClose }: { onClose: () => void }) {
    const imageSize = 64;

    const [audioCreationState, setAudioCreationState] = useState<"upload" | "synthesize">("synthesize");
    const [imageCreationState, setImageCreationState] = useState<"upload" | "draw">("draw");
    const uplaodedImageRef = useRef<string>(null);
    const uploadedAudioRef = useRef<string>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const drewnImageRef = useRef<string[]>(Array.from({ length: imageSize * imageSize }).map(() => "transparent"));
    const [currentColorIndex, setCurrentColorIndex] = useState<number>(0);
    const [colors, setColors] = useState<string[]>(["rgb(255, 255, 0)", "rgb(0, 255, 0)"]);
    const [currentUploadFileNameAudio, setCurrentUploadFileNameAudio] = useState<string>("");
    const [currentUploadFileNameImage, setCurrentUploadFileNameImage] = useState<string>("");

    const [currentToolSelected, setToolSelected] = useState<"brush" | "eraser" | "fill">("brush");

    const openFileRef = useRef<HTMLInputElement>(document.createElement("input"));

    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

    const customFlavors = useCustomFlavors();
    document.body.appendChild(openFileRef.current);


    const uploadImage = () => {
        openFileRef.current.type = "file";
        openFileRef.current.accept = "image/png, image/jpeg, image/bpm, image/webp, .png, .jpeg, .jpg, .bpm, .webp";
        openFileRef.current.addEventListener("change", async () => {
            const files = openFileRef.current.files;
            if (files?.length == 1) {
                const file = files[0];
                const base64 = await fileToBase64(file);
                setCurrentUploadFileNameImage(file.name);
                if (!base64) {
                    Utils.error("Failed to upload the flavor image");
                    return;
                }
                uplaodedImageRef.current = base64;
            }
        });

        openFileRef.current.style.opacity = "0";
        openFileRef.current.style.visibility = "hidden";


        openFileRef.current.click();
    };


    const uploadAudio = () => {
        openFileRef.current.type = "file";
        openFileRef.current.accept = "audio/wav, audio/mp3, .mp3, .wav";
        openFileRef.current.addEventListener("change", async () => {
            const files = openFileRef.current.files;
            if (files?.length == 1) {
                const file = files[0];
                setCurrentUploadFileNameAudio(file.name);
                const base64 = await fileToBase64(file);
                if (!base64) {
                    Utils.error("Failed to upload the flavor audio");
                    return;
                }
                console.log(base64);
                uploadedAudioRef.current = base64;
            }
        });
        openFileRef.current.click();
    };

    useEffect(() => {
        render();
    }, []);

    useEffect(() => {
        if (!drawingCanvasRef.current) return;
        const canvas = drawingCanvasRef.current;
        let mouseDown = false;

        function drawLine(x0: number, y0: number, x1: number, y1: number, draw: (pos: [number, number]) => void) {
            const dx = Math.abs(x1 - x0);
            const dy = Math.abs(y1 - y0);

            const sx = x0 < x1 ? 1 : -1;
            const sy = y0 < y1 ? 1 : -1;

            let err = dx - dy;

            while (true) {
                draw([x0, y0]);

                if (x0 === x1 && y0 === y1) break;

                const e2 = 2 * err;

                if (e2 > -dy) {
                    err -= dy;
                    x0 += sx;
                }

                if (e2 < dx) {
                    err += dx;
                    y0 += sy;
                }
            }
        }

        let lastPos = [-1, -1];
        function mouseMove(e: MouseEvent, override = false) {
            if (!mouseDown && !override) return;
            const box = canvas.getBoundingClientRect();

            const width = box.width;
            const x = Math.floor((e.clientX - box.left));
            const y = Math.floor((e.clientY - box.top));

            const xPercentage = x / width;
            const yPercentage = y / width;

            const xCanvas = Math.round(xPercentage * imageSize);
            const yCanvas = Math.round(yPercentage * imageSize);

            const drawAt = (pos: [number, number]) => {
                const i = (pos[1] * imageSize) + pos[0];
                switch (currentToolSelected) {
                    case "brush":
                        drewnImageRef.current[i] = colors[currentColorIndex];
                        break;
                    case "eraser":
                        drewnImageRef.current[i] = "transparent";
                        break;
                }
            };

            if (override) {
                drawAt([xCanvas, yCanvas]);
                render();
            }

            if (mouseDown) {
                if (lastPos[0] != -1 && lastPos[1] != -1) {
                    drawLine(xCanvas, yCanvas, lastPos[0], lastPos[1], drawAt);
                    lastPos = [xCanvas, yCanvas];
                } else if (mouseDown) {
                    lastPos = [xCanvas, yCanvas];
                    drawAt([xCanvas, yCanvas]);
                }

                render();
            }

        };

        function clicked(e: MouseEvent) {
            const box = canvas.getBoundingClientRect();

            const width = box.width;
            const x = Math.floor((e.pageX - box.left));
            const y = Math.floor((e.pageY - box.top));

            const xPercentage = x / width;
            const yPercentage = y / width;

            const xCanvas = Math.round(xPercentage * imageSize);
            const yCanvas = Math.round(yPercentage * imageSize);

            if (currentToolSelected == "fill") {
                if (e.shiftKey) {
                    fillEverything(drewnImageRef, xCanvas, yCanvas, colors[currentColorIndex], imageSize);
                } else {
                    fill(drewnImageRef, xCanvas, yCanvas, colors[currentColorIndex], imageSize);
                }
                render();
            } else {
                mouseMove(e, true);
            }
        }

        const mouseReleased = () => { mouseDown = false; lastPos = [-1, -1]; };
        const mousePressed = () => { mouseDown = true; lastPos = [-1, -1]; };

        const width = canvas.width;
        const height = canvas.height;

        const pixelToCanvasRatio = width / imageSize;

        canvas.addEventListener("mousemove", mouseMove);
        canvas.addEventListener("click", clicked);
        canvas.addEventListener("mousedown", mousePressed);
        canvas.addEventListener("mouseup", mouseReleased);
        canvas.addEventListener("mouseout", () => lastPos = [-1, -1]);
        window.addEventListener("mouseup", mouseReleased);

        return () => {
            canvas.removeEventListener("mousemove", mouseMove);
            canvas.removeEventListener("click", clicked);
            canvas.removeEventListener("mousedown", mousePressed);
            canvas.removeEventListener("mouseup", mouseReleased);
            window.removeEventListener("mouseup", mouseReleased);
        }

    }, [drawingCanvasRef.current, colors[currentColorIndex], currentToolSelected]);

    function render() {
        const canvas = drawingCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;
        if (!canvas) return;// For ts
        const width = canvas.width;
        const height = canvas.height;

        const pixelToCanvasRatio = width / imageSize;

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < drewnImageRef.current.length; i++) {
            const y = Math.floor(i / imageSize);
            const x = i % imageSize;

            ctx.fillStyle = drewnImageRef.current[i];
            ctx.fillRect(x * pixelToCanvasRatio, y * pixelToCanvasRatio, pixelToCanvasRatio, pixelToCanvasRatio);
        }

        for (let x = 0; x < imageSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * pixelToCanvasRatio, 0);
            ctx.lineTo(x * pixelToCanvasRatio, height);
            ctx.closePath();
            ctx.strokeStyle = "2px rgba(0, 0, 0, 0.2)";
            ctx.stroke();
        }

        for (let y = 0; y < imageSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * pixelToCanvasRatio);
            ctx.lineTo(width, y * pixelToCanvasRatio);
            ctx.closePath();
            ctx.strokeStyle = "2px rgba(0, 0, 0, 0.2)";
            ctx.stroke();
        }

    }

    const currentChosenColorRef = useRef<RgbaColor>(null);

    const addColor = () => {
        if (!currentChosenColorRef.current) return;
        const color = currentChosenColorRef.current;
        const colorStr = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        if (colors.includes(colorStr)) return;
        setColors(c => [...c, colorStr])
    };

    const updateCurrentChosenColor = (rgba: RgbaColor) => {
        currentChosenColorRef.current = rgba;
    };

    const getDrawnAsBase64 = async () => {
        const canvas = new OffscreenCanvas(64, 64);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < drewnImageRef.current.length; i++) {
            const y = Math.floor(i / imageSize);
            const x = i % imageSize;

            ctx.fillStyle = drewnImageRef.current[i];
            ctx.fillRect(x, y, 1, 1);
        }

        const base64 = fileToBase64(await canvas.convertToBlob());
        return base64;
    }

    const createFlavor = async () => {
        const image = imageCreationState == "draw" ? await getDrawnAsBase64() : uplaodedImageRef.current;
        const audio = audioCreationState == "synthesize" ? undefined : uploadedAudioRef.current;
        const colors: [string, string, string] = ["#FFF", "#FFF", "#FFF"];
        const flavorName = nameInputRef.current?.value;

        if (!image) {
            Utils.error("You have to upload or create an image");
            return;
        }

        if (!audio) {
            Utils.error("You have to upload or create an audio file");
            return;
        }

        if (!flavorName) {
            Utils.error("You have to enter a name");
            return;
        }

        const newFlavor: CustomFlavor = {
            audio: audio,
            flavorName: flavorName,
            image: image,
            colors: colors
        };

        addCustomFlavor(newFlavor, customFlavors);
    }

    return <div className="add-custom-flavor-bg">
        <div className="blur-bg"></div>
        <PixelDivWBorder max-pixel-width={30} className="add-custom-flavor-dialog">
            <button className="close" onClick={onClose}>x</button>
            <div className="overflow">

                <h1>Custom Flavor Maker</h1>

                <div className="name">
                    <PixelInput max-pixel-width={20} className="name-input" placeholder="Name" ref={nameInputRef}></PixelInput>
                </div>

                <div className="audio input-wrapper-div">
                    <h2>Audio</h2>
                    <PixelDivWBorder max-pixel-width={20} className="tabs">
                        <PixelButton max-pixel-width={15} data-selected={audioCreationState == "upload" ? true : undefined} className="upload" onClick={() => setAudioCreationState("upload")}>Upload Flavor</PixelButton>
                        <PixelButton max-pixel-width={15} data-selected={audioCreationState == "synthesize" ? true : undefined} className="synthesize" onClick={() => setAudioCreationState("synthesize")}>Synthesize Flavor</PixelButton>
                    </PixelDivWBorder>

                    {
                        audioCreationState == "upload" && <div className="upload-flavor">
                            <h3>Upload Flavor</h3>

                            <span className="upload-label">Select the audio to use for this flavor:</span>
                            <PixelButton max-pixel-width={15} className="select-file" onClick={uploadAudio}>Select an audio file</PixelButton>
                            <span className="currently-uploaded">Current: {currentUploadFileNameAudio}</span>
                        </div>
                    }

                    {
                        audioCreationState == "synthesize" && <div className="synthesize-flavor">
                            <h3>Synthesize Flavor</h3>
                        </div>
                    }

                </div>

                <div className="image input-wrapper-div">
                    <h2>Image / Colors</h2>
                    <PixelDivWBorder max-pixel-width={20} className="tabs">
                        <PixelButton max-pixel-width={15} data-selected={imageCreationState == "upload" ? true : undefined} className="upload" onClick={() => setImageCreationState("upload")}>Upload Image</PixelButton>
                        <PixelButton max-pixel-width={15} data-selected={imageCreationState == "draw" ? true : undefined} className="draw" onClick={() => setImageCreationState("draw")}>Draw Image</PixelButton>
                    </PixelDivWBorder>

                    {
                        imageCreationState == "upload" && <div className="upload-image">
                            <h3>Upload Image</h3>

                            <span className="upload-label">Select an image for the flavor that represents it:</span>
                            <PixelButton max-pixel-width={15} className="select-file" onClick={uploadImage}>Select an image file</PixelButton>
                            <span className="currently-uploaded">Current: {currentUploadFileNameImage}</span>

                        </div>
                    }

                    {
                        imageCreationState == "draw" && <div className="draw-image">
                            <h3>Draw Image</h3>

                            <div className="content">
                                <canvas width={600} height={600} className="image-canvas" ref={(e) => { drawingCanvasRef.current = e; render(); }}>Your device does not support canvas</canvas>

                                <div className="tools">
                                    <div className="brushes">
                                        <button data-selected={currentToolSelected == "brush" ? true : undefined} onClick={() => setToolSelected("brush")} className="brush">
                                            <img src="./imgs/actionButtons/customFlavors/brush.png" />
                                            <div className="mask-paint-layer" style={{ "--paint-color-mask": "url('./imgs/actionButtons/customFlavors/brush_mask.png')", "--current-color": colors[currentColorIndex] } as any}></div>
                                        </button>
                                        <button data-selected={currentToolSelected == "eraser" ? true : undefined} onClick={() => setToolSelected("eraser")} className="eraser">
                                            <img src="./imgs/actionButtons/customFlavors/eraser.png" />
                                            <div className="mask-paint-layer" style={{ "--paint-color-mask": "url('./imgs/actionButtons/customFlavors/eraser_mask.png')", "--current-color": colors[currentColorIndex] } as any}></div>
                                        </button>
                                        <button data-selected={currentToolSelected == "fill" ? true : undefined} onClick={() => setToolSelected("fill")} className="fill">
                                            <img src="./imgs/actionButtons/customFlavors/fill.png" />
                                            <div className="mask-paint-layer" style={{ "--paint-color-mask": "url('./imgs/actionButtons/customFlavors/fill_mask.png')", "--current-color": colors[currentColorIndex] } as any}></div>
                                        </button>
                                    </div>

                                    <PixelDivWBorder max-pixel-width={20} className="color-chooser">
                                        <div className="colors">

                                            {
                                                colors.map((color, i) => {
                                                    return <PixelButton data-selected={i == currentColorIndex ? true : undefined} max-pixel-width={5} key={color + i} className="color" style={{ "--button-color": color } as any} onClick={() => setCurrentColorIndex(i)}></PixelButton>
                                                })
                                            }
                                        </div>
                                        <div className="color-picker">
                                            <PixelButton max-pixel-width={10} className="add-color" onClick={addColor}>Add</PixelButton>
                                            <RgbaColorPicker onChange={updateCurrentChosenColor}>
                                                Pick a color to add
                                            </RgbaColorPicker>
                                        </div>
                                    </PixelDivWBorder>
                                </div>
                            </div>

                        </div>
                    }

                </div>

                <PixelButton max-pixel-width={20} className="create" onClick={createFlavor}>Create</PixelButton>
            </div>
        </PixelDivWBorder>
    </div>;
}

const fill = (data: React.RefObject<string[]>, x: number, y: number, fillColor: string, imageSize: number) => {
    const index = y * imageSize + x;
    const selectedColor = data.current[index];
    if (fillColor == selectedColor) return;

    function fill(x: number, y: number) {
        const stack: [number, number][] = [[x, y]];

        while (stack.length > 0) {
            const [cx, cy] = stack.pop()!;

            for (let xi = -1; xi < 2; xi++) {
                for (let yi = -1; yi < 2; yi++) {
                    if (xi == yi) continue;
                    if (xi == 0 && yi == 0) continue;

                    const nx = cx + xi;
                    const ny = cy + yi;

                    if (nx < 0 || ny < 0 || nx >= imageSize || ny >= imageSize) continue;

                    const i = ny * imageSize + nx;

                    if (data.current[i] === selectedColor) {
                        data.current[i] = fillColor;
                        stack.push([nx, ny]);
                    }
                }
            }
        }
    }

    fill(x, y);
}

const fillEverything = (data: React.RefObject<string[]>, x: number, y: number, fillColor: string, imageSize: number) => {
    const index = y * imageSize + x;
    const selectedColor = data.current[index];
    if (fillColor == selectedColor) return;

    for (let x = 0; x < imageSize; x++) {
        for (let y = 0; y < imageSize; y++) {
            const index = y * imageSize + x;
            if (data.current[index] == selectedColor) {
                data.current[index] = fillColor;
            }
        }
    }
}

const fileToBase64 = async (file: File | Blob) =>
    new Promise<string | undefined>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result?.toString());
        reader.onerror = (e) => reject(e);
    });

function toColor(num: number) {
    var b = num & 0xFF,
        g = (num & 0xFF00) >>> 8,
        r = (num & 0xFF0000) >>> 16,
        a = ((num & 0xFF000000) >>> 24) / 255;
    return "rgba(" + [r, g, b, a].join(",") + ")";
}

function fromColor(color: string) {
    const [r, g, b, a] = color.match(/[\d.]+/g)!.map(Number);
    return ((Math.round(a * 255) & 0xFF) << 24) |
        ((r & 0xFF) << 16) |
        ((g & 0xFF) << 8) |
        (b & 0xFF);
}