import { useRef, useState } from "react";
import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import "./OpenShareDialog.scss";
import { FLAVORS } from "../../audio/Flavors";

const SHARE_FLAVOR_COMBO_LENGTH = 6;
const AI_IMAGE_SIZE = 64;

const maskImageVines = new Image();
maskImageVines.src = "./masks/background-main-flavor-vines-mask_alpha.png";

const maskImageMainVines = new Image();
maskImageMainVines.src = "./masks/background-main-flavor-main-mask_alpha.png";

export default function OpenShareDialog({ visible, setOpenShareDialogOpened, open }: { visible: boolean; setOpenShareDialogOpened: (open: boolean) => void; open: (openData: OpenData) => void }) {

    const [currentFlavorsSelected, setCurrentFlavorsSelected] = useState<FlavorsSelected[]>([]);
    const currentFlavorsSelectedRef = useRef<FlavorsSelected[]>([]);
    const comboBoxRef = useRef<HTMLDivElement>(null);
    const digitsRef = useRef<HTMLDivElement>(null);
    const uploadedImageInputRef = useRef<HTMLInputElement>(null);
    const currentUploadedFileNameDisplayRef = useRef<HTMLInputElement>(null);

    const [isOkButtonCodeIsDisabled, setOkButtonCodeIsDisabled] = useState<boolean>(true);
    const [isOkButtonFlavorsIsDisabled, setOkButtonFlavorsIsDisabled] = useState<boolean>(true);
    const [isOkButtonUploadedIsDisabled, setOkButtonUploadedIsDisabled] = useState<boolean>(true);


    const getFlavorIndex = (index: number) => {
        return currentFlavorsSelectedRef.current.find(e => e.index == index);
    };

    const setFlavor = (index: number, flavor: Flavor) => {
        const newFlavorsSelected = currentFlavorsSelectedRef.current.filter(e => e.index != index);
        newFlavorsSelected.push({
            flavor: flavor,
            index: index
        });
        setCurrentFlavorsSelected([...newFlavorsSelected]);
        currentFlavorsSelectedRef.current = newFlavorsSelected;
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
        }
        checkForValidFlavors();
    };

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
        if (currentFlavorsSelectedRef.current.length > 6) return;
        open({
            type: "flavors",
            flavors: currentFlavorsSelectedRef.current.sort((a, b) => a.index - b.index).map(e => e.flavor)
        });
    };

    const openImage = async () => {
        if (!uploadedImageInputRef.current) return;
        const files = uploadedImageInputRef.current.files;
        if (!files) return;
        const file = files[0];
        open({
            type: "image",
            image: (await fileToBase64(file)) ?? ""
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


    return <div className={"open-share-dialog-wrapper" + (visible ? " visible" : "")}>
        <div role="dialog" className="open-share-dialog">
            <h1>Open Shared Dish</h1>


            <div className="open-share-flavors open-share-default-layout">
                <h2>Open Shared Flavors</h2>
                <span>Open a shared dish with a flavor combo.</span>

                <div className="combo content" onDragOver={onDragOver} onDrop={onDropFlavor} ref={comboBoxRef}>
                    {
                        Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                            const name = getFlavorIndex(i);
                            if (!name) {
                                return <div key={i} className="share-flavors-flavor-no-selected" style={{ "--main-color": "#707070", "--vine-color": "#707070" } as any}>
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
                            const ref = useRef<HTMLInputElement>(null);
                            return <input key={i} className="digit" data-index={i} ref={(r) => {
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
                                        e.preventDefault();
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
                                                return;
                                            case "ArrowLeft":
                                                prev?.focus();
                                                return;
                                            case "ArrowRight":
                                                next?.focus();
                                                return;

                                            case "v":
                                                if (e.ctrlKey) {
                                                    navigator.clipboard.readText().then(e => {
                                                        paste(e);
                                                    });
                                                }
                                                return;

                                            default:
                                                return;
                                        }
                                        next?.setSelectionRange(0, 1);
                                        next?.focus();
                                        checkForValid();
                                    });

                                }
                            }}></input>
                        })
                    }
                </div>

                <div className="buttons">
                    <button className="ok" disabled={isOkButtonCodeIsDisabled} onClick={() => openCode()}>Open</button>
                </div>

            </div>

            <div className="action-buttons">
                <button className="close" onClick={() => setOpenShareDialogOpened(false)}>X</button>
            </div>

        </div>
    </div>;
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
    type: "image";
    image: string;
}

type OpenURL = {
    type: "url";
    url: string;
};