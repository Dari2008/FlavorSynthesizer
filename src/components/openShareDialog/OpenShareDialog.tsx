import { useEffect, useRef, useState } from "react";
import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import "./OpenShareDialog.scss";
import { FLAVORS } from "../../audio/Flavors";
import { useGameState } from "../../contexts/GameStateContext";
import { getSpan, setSpan, setSpanFirstTime } from "../FlavorUtils";
import withTutorialStarter from "../../hooks/TutorialStarter";
import { getCurrentDragging } from "../flavorSynth/CurrentDraggingReference";
import PixelInput from "../pixelDiv/PixelInput";
import PixelButton from "../pixelDiv/PixelButton";
import { useMultiplayer } from "../../contexts/MultiplayerContext";
import type { ShareDigits } from "../../@types/Api";
import PixelDiv from "../pixelDiv/PixelDiv";
import PixelDivWBorder from "../pixelDiv/PixelDivWBorder";
import Utils from "../../utils/Utils";

const SHARE_FLAVOR_COMBO_LENGTH = 6;
const AI_IMAGE_SIZE = 64;

const maskImageVines = new Image();
maskImageVines.src = "./masks/background-main-flavor-vines-mask_alpha.png";

const maskImageMainVines = new Image();
maskImageMainVines.src = "./masks/background-main-flavor-main-mask_alpha.png";

const ROOT_PATH = "./imgs/shareDish-bgs/"

const BG_IMAGES = [
    "dish.png",
    "fruits.png",
    "workbench.png"
];


export default function OpenShareDialog({ open }: { open: (openData: OpenData) => void }) {

    // const [currentFlavorsSelected, setCurrentFlavorsSelected] = useState<FlavorsSelected[]>([]);
    const [currentFlavorsSelected, setCurrentFlavorsSelected] = useState<FlavorsSelected[]>([]);
    const comboBoxRef = useRef<HTMLDivElement>(null);
    const digitsRef = useRef<HTMLDivElement>(null);
    const uploadedImageInputRef = useRef<HTMLInputElement>(null);
    const currentUploadedFileNameDisplayRef = useRef<HTMLInputElement>(null);
    const [shareJoin, setShareJoin] = useState<"share" | "join" | "none">("none");

    const [isOkButtonCodeIsDisabled, setOkButtonCodeIsDisabled] = useState<boolean>(true);
    const [isOkButtonFlavorsIsDisabled, setOkButtonFlavorsIsDisabled] = useState<boolean>(true);
    const [isOkButtonUploadedIsDisabled, setOkButtonUploadedIsDisabled] = useState<boolean>(true);

    const bgImageIndex = useRef<number>(generateRandomBackgroundImage());

    const gameState = useGameState();
    const multiplayer = useMultiplayer();

    useEffect(() => {
        setSpanFirstTime(window.innerWidth, {
            from: 0,
            to: 60
        });
        setSpan(window.innerWidth, getSpan());
    }, []);

    useEffect(() => {
        return () => {
            setShareJoin("none");
        };
    }, []);

    withTutorialStarter("openedOpenShare");

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
        const dragging = getCurrentDragging();
        if ((dragging && dragging.flavor && FLAVORS.map(e => e.NAME).includes(dragging.flavor)) || (e.dataTransfer.getData("flavor/plain") && FLAVORS.map(e => e.NAME).includes(e.dataTransfer.getData("flavor/plain") as Flavor))) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const onDropFlavor = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (!e.dataTransfer) return;
        const dragging = getCurrentDragging();
        if ((dragging && dragging.flavor && FLAVORS.map(e => e.NAME).includes(dragging.flavor)) || (e.dataTransfer.getData("flavor/plain") && FLAVORS.map(e => e.NAME).includes(e.dataTransfer.getData("flavor/plain") as Flavor))) {
            e.preventDefault();
            e.stopPropagation();

            const flavorName = ((!!e.dataTransfer.getData("flavor/plain")) ? e.dataTransfer.getData("flavor/plain") : dragging?.flavor) as Flavor;
            if (!flavorName) return;
            setFlavor(index, flavorName);
        }
    };

    useEffect(() => {
        checkForValidFlavors();
    }, [currentFlavorsSelected]);

    const checkForValidFlavors = () => {
        for (let i = 0; i < SHARE_FLAVOR_COMBO_LENGTH; i++) {
            if (getFlavorIndex(i) == undefined) {
                setOkButtonFlavorsIsDisabled(true);
                return;
            }
        }
        setOkButtonFlavorsIsDisabled(false);
    }

    const openFlavors = () => {
        if (currentFlavorsSelected.length > 6) return;
        open({
            type: "flavors",
            flavors: currentFlavorsSelected.sort((a, b) => a.index - b.index).map(e => e.flavor)
        });
    };

    const openImage = async () => {
        if (!uploadedImageInputRef.current) return;
        const files = uploadedImageInputRef.current.files;
        if (!files) return;
        const file = files[0];
        open({
            type: "aiImage",
            aiImage: (await fileToBase64(file)) ?? ""
        });
    };

    const openCode = () => {
        const digits = Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
            if (!digitsRef.current) return undefined;
            const element = digitsRef.current.querySelector(`input[data-index="${i}"]`) as HTMLInputElement;
            return Math.round(parseInt(element.value ?? "0") % 10) as Digit;
        }).filter(e => (e != null && e != undefined));
        if (digits.length != SHARE_FLAVOR_COMBO_LENGTH) return;

        open({
            type: "code",
            code: digits
        });
    };


    const joinCode = () => {
        const digits = Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
            if (!digitsRef.current) return undefined;
            const element = digitsRef.current.querySelector(`input[data-index="${i}"]`) as HTMLInputElement;
            return Math.round(parseInt(element.value ?? "0") % 10) as Digit;
        }).filter(e => (e != null && e != undefined));

        if (digits.length != SHARE_FLAVOR_COMBO_LENGTH) {
            Utils.error("All digits have to be set");
            return;
        }
        multiplayer.joinGame(digits as ShareDigits);
    }


    return <div className={"open-share-dialog-wrapper" + (gameState.gameState == "openShared" ? " visible" : "")}>
        <PixelDivWBorder max-pixel-width={40} role="dialog" className="open-share-dialog">
            <PixelDiv className="image-bg" style={{ "--bg-image": `url(${ROOT_PATH + BG_IMAGES[bgImageIndex.current]})` } as any}></PixelDiv>

            {
                shareJoin == "none" && <div className="content-wrapper choose">
                    <PixelButton className="join" onClick={() => setShareJoin("join")}>Join a Multiplayer dish</PixelButton>
                    <PixelButton className="share" onClick={() => setShareJoin("share")}>Open a shared dish</PixelButton>
                </div>
            }

            {shareJoin == "share" && <div className="content-wrapper share">
                <h1>Open Shared Dish</h1>
                <div className="open-share-flavors open-share-default-layout">
                    <h2>Open Shared Flavors</h2>
                    <span>Open a shared dish with a flavor combo.</span>

                    <div className="combo content" ref={comboBoxRef}>
                        {
                            Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                                const name = getFlavorIndex(i);
                                if (!name) {
                                    return <div key={i} onDragOver={onDragOver} onDrop={(e) => onDropFlavor(e, i)} className="share-flavors-flavor-no-selected" style={{ "--main-color": "#707070", "--vine-color": "#3d3d3d" } as any}>
                                        <div className="bgImage main-color"></div>
                                        <div className="bgImage main-color-2"></div>
                                        <div className="text">Drag a flavor here</div>
                                    </div>;
                                }

                                return <div key={i} onDragOver={onDragOver} onDrop={(e) => onDropFlavor(e, i)} className="share-flavors-flavor">
                                    <div className="bgImage main-color" style={{ "--main-color": FLAVOR_COLOR[name.flavor][0] } as any}></div>
                                    <div className="bgImage main-color-2" style={{ "--vine-color": FLAVOR_COLOR[name.flavor].at(-1) } as any}></div>
                                    <img src={FLAVOR_IMAGES[name.flavor]} alt={name.flavor} className="flavor-image" />
                                    <div className="text">Drag a flavor here</div>
                                </div>
                            })
                        }
                    </div>
                    <div className="buttons">
                        <button className="ok" disabled={isOkButtonFlavorsIsDisabled} onClick={() => openFlavors()}>Open</button>
                    </div>
                </div>

                <div className="open-share-image open-share-default-layout">
                    <h2>Open Shared Image</h2>
                    <span>Open a shared dish with an AI generated Image.</span>
                    <div className="content">
                        <button className="upload" onClick={() => uploadedImageInputRef.current?.click()}>Upload Image</button>
                        <span className="uploadedImageName" ref={currentUploadedFileNameDisplayRef}></span>
                        <input type="file" name="image" className="imageUpload" accept="image/png, image/jpg, image/jpeg" onInput={() => {
                            if (currentUploadedFileNameDisplayRef.current) {
                                const files = uploadedImageInputRef.current?.files;
                                if (!files) {
                                    currentUploadedFileNameDisplayRef.current.textContent = "";
                                    setOkButtonUploadedIsDisabled(true);
                                    return;
                                }

                                fileToBase64(files[0]).then(imageData => {

                                    const image = new Image();
                                    image.src = imageData;

                                    image.onload = () => {
                                        const width = image.width;
                                        const height = image.height;
                                        if (width != AI_IMAGE_SIZE || height != AI_IMAGE_SIZE) {
                                            if (currentUploadedFileNameDisplayRef.current) {
                                                currentUploadedFileNameDisplayRef.current.textContent = "Error: Too big (" + files[0].name + ")";
                                            }
                                            setOkButtonUploadedIsDisabled(true);
                                            return;
                                        }
                                        if (currentUploadedFileNameDisplayRef.current) {
                                            currentUploadedFileNameDisplayRef.current.textContent = files[0].name;
                                        }
                                        setOkButtonUploadedIsDisabled(false);
                                    };
                                });
                                if (currentUploadedFileNameDisplayRef.current) {
                                    currentUploadedFileNameDisplayRef.current.textContent = "Loading: " + files[0].name;
                                }
                                setOkButtonUploadedIsDisabled(true);
                            }
                        }} ref={uploadedImageInputRef} />
                    </div>
                    <div className="buttons">
                        <button className="ok" disabled={isOkButtonUploadedIsDisabled} onClick={() => openImage()} >Open</button>
                    </div>
                </div>
                <div className="open-share-code open-share-default-layout">
                    <h2>Open Shared Code</h2>
                    <span>Open a shared dish with a code.</span>

                    <div className="content" ref={digitsRef}>
                        {
                            Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                                return <DigitItem key={i} setOkButtonCodeIsDisabled={setOkButtonCodeIsDisabled} i={i} digitsRef={digitsRef} />
                            })
                        }
                    </div>

                    <div className="buttons">
                        <button className="ok" disabled={isOkButtonCodeIsDisabled} onClick={() => openCode()}>Open</button>
                    </div>

                </div>
            </div>}

            {
                shareJoin == "join" && <div className="content-wrapper join">
                    <h1>Join a Multiplayer dish</h1>
                    <div className="open-share-code open-share-default-layout">
                        <h2>Join a dish</h2>
                        <div className="content" ref={digitsRef}>
                            {
                                Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                                    return <DigitItem key={i} setOkButtonCodeIsDisabled={setOkButtonCodeIsDisabled} i={i} digitsRef={digitsRef} />
                                })
                            }
                        </div>

                        <div className="buttons">
                            <button className="ok" disabled={isOkButtonCodeIsDisabled} onClick={() => joinCode()}>Open</button>
                        </div>

                    </div>
                </div>
            }

            <div className="action-buttons">
                <button className="close" onClick={() => gameState.goBack()}>X</button>
            </div>

        </PixelDivWBorder>
    </div>;
}

function DigitItem({ i, digitsRef, setOkButtonCodeIsDisabled }: { i: number, digitsRef: React.RefObject<HTMLDivElement | null>, setOkButtonCodeIsDisabled: React.Dispatch<React.SetStateAction<boolean>> }) {
    const ref = useRef<HTMLInputElement>(null);
    return <PixelInput className="digit .pixel-div" data-index={i} ref={(r) => {
        ref.current = r;
        if (r) {
            const parentDiv = r.parentElement;
            if (!parentDiv) return;

            const next = parentDiv.querySelector(
                `input[data-index='${i + 1}']`
            ) as HTMLInputElement | null;

            const prev = parentDiv.querySelector(
                `input[data-index='${i - 1}']`
            ) as HTMLInputElement | null;

            const paste = (content: string | undefined) => {
                content = content?.replaceAll(/\s/g, "");
                if (content?.length != SHARE_FLAVOR_COMBO_LENGTH) return;
                for (let i = 0; i < SHARE_FLAVOR_COMBO_LENGTH; i++) {
                    const c = parentDiv.querySelector(`input[data-index='${i}']`) as HTMLInputElement | null;
                    if (c) c.value = content.at(i) ?? "0";
                }
                checkForValid();
                (parentDiv.querySelector(`input[data-index='${SHARE_FLAVOR_COMBO_LENGTH - 1}']`) as HTMLInputElement | null)?.focus();
            };

            const checkForValid = () => {
                const digits = Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                    if (!digitsRef.current) return undefined;
                    const element = digitsRef.current.querySelector(`input[data-index="${i}"]`) as HTMLInputElement;
                    if (!element.value) return;
                    return Math.round(parseInt(element.value) % 10) as Digit;
                }).filter(e => (e != null && e != undefined));
                if (digits.length != SHARE_FLAVOR_COMBO_LENGTH) {
                    setOkButtonCodeIsDisabled(true);
                    return;
                }
                setOkButtonCodeIsDisabled(false);
            };

            r.addEventListener("paste", (e: ClipboardEvent) => {
                const content = e.clipboardData?.getData("text").trim().replace(/[^\d]/g, "");
                e.preventDefault();
                paste(content);
            });

            r.addEventListener("input", () => {
                checkForValid();
            });

            r.addEventListener('keydown', (e: KeyboardEvent) => {
                const val = r.value;
                switch (e.key) {
                    case "0":
                        r.value = "0";
                        break;
                    case "1":
                        r.value = "1";
                        break;
                    case "2":
                        r.value = "2";
                        break;
                    case "3":
                        r.value = "3";
                        break;
                    case "4":
                        r.value = "4";
                        break;
                    case "5":
                        r.value = "5";
                        break;
                    case "6":
                        r.value = "6";
                        break;
                    case "7":
                        r.value = "7";
                        break;
                    case "8":
                        r.value = "8";
                        break;
                    case "9":
                        r.value = "9";
                        break;
                    case "Backspace":
                        if (val.length == 0) {
                            prev?.focus();
                        } else {
                            r.value = "";
                        }
                        checkForValid();
                        e.preventDefault();
                        return;
                    case "ArrowLeft":
                        e.preventDefault();
                        prev?.focus();
                        return;
                    case "ArrowRight":
                        e.preventDefault();
                        next?.focus();
                        return;

                    case "v":
                        if (e.ctrlKey) {
                            return;
                        }
                        e.preventDefault();
                        return;

                    default:
                        e.preventDefault();
                        return;
                }
                e.preventDefault();
                next?.setSelectionRange(0, 1);
                next?.focus();
                checkForValid();
            });

        }
    }}></PixelInput>;
}

function generateRandomBackgroundImage() {
    return Math.round(Math.random() * (3 - 1));
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            // result includes: "data:<mime>;base64,XXXX"
            resolve(reader.result as string);
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

type FlavorsSelected = {
    flavor: Flavor;
    index: number;
};

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type OpenData = OpenFlavors | OpenCode | OpenAIImage | OpenURL;

type OpenFlavors = {
    type: "flavors";
    flavors: Flavor[];
}

type OpenCode = {
    type: "code";
    code: Digit[];
}

type OpenAIImage = {
    type: "aiImage";
    aiImage: string;
}

type OpenURL = {
    type: "url";
    url: string;
};