import { useRef, useState } from "react";
import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import "./ShareDialog.scss";
import { FLAVORS } from "../../audio/Flavors";
import { BASE_URL } from "../../utils/Statics";
import type { APIResponse, Digit, FlavorsSelected, ShareErrorResponse, ShareResponse } from "../../@types/Api";
import Utils from "../../utils/Utils";
import { loginUser, registerUser } from "../../utils/UserUtils";
import { useUser } from "../../contexts/UserContext";
import { useMainFlavor } from "../../contexts/MainFlavorContext";
import { useGameState } from "../../contexts/GameStateContext";
import { useCurrentDish } from "../../contexts/CurrentDish";
import { getImage, loadImage, setCallbackForImageLoad } from "../../download/ImageDownloadManager";

const SHARE_FLAVOR_COMBO_LENGTH = 6;
const COPY_WIDTH_PER_FLAVOR = 80;
const GAP_BETWEEN_FLAVORS = 20;

const maskImageVines = new Image();
maskImageVines.src = "./masks/background-main-flavor-vines-mask_alpha.png";

const maskImageMainVines = new Image();
maskImageMainVines.src = "./masks/background-main-flavor-main-mask_alpha.png";

export default function ShareDialog() {

    const [currentFlavorsSelected, setCurrentFlavorsSelected] = useState<FlavorsSelected[]>([]);
    const comboBoxRef = useRef<HTMLDivElement>(null);
    const [AIGeneratedImageBase64, setAIGeneratedImageBase64] = useState<string>("");
    const [shareDigits, setSD] = useState<Digit[]>([0, 0, 0, 0, 0, 0]);
    const [shareURL, setShareUrl] = useState<string>(location.origin + "/?code=");
    const [isPublished, setPublished] = useState<boolean>(false);
    // const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
    const [accepedUnchangable, setAcceptedUnchangable] = useState<boolean>(false);
    const imageIdRef = useRef<number>(generateRandomBackgroundImage());
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const loginEmailRef = useRef<HTMLInputElement>(null);
    const loginUsernameRef = useRef<HTMLInputElement>(null);
    const loginPasswordRef = useRef<HTMLInputElement>(null);

    const user = useUser();
    const currentDish = useCurrentDish();
    const mainFlavor = useMainFlavor();
    const gameState = useGameState();

    const [BG_IMAGES, setBgImages] = useState<(string | undefined)[]>([]);

    setCallbackForImageLoad([
        "share_dish_bg_workbench",
        "share_dish_bg_fruits",
        "share_dish_bg_dish"
    ], async () => {
        setBgImages([
            await loadImage("share_dish_bg_workbench"),
            await loadImage("share_dish_bg_fruits"),
            await loadImage("share_dish_bg_dish")
        ]);
    });

    const setShareDigits = (numbers: Digit[]) => {
        setSD(numbers);
        setShareUrl(location.origin + "/?code=" + numbers.join(""));
    }

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
        if (isPublished) return;
        if (!e.dataTransfer) return;
        if (e.dataTransfer.getData("text/plain") && FLAVORS.map(e => e.NAME).includes(e.dataTransfer.getData("text/plain") as Flavor)) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const onDropFlavor = (e: React.DragEvent<HTMLDivElement>) => {
        if (isPublished) return;
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

    const publish = async () => {
        const tracks = currentDish?.data;
        if (!tracks) return;
        if (tracks.length == 0) {
            Utils.error("Can't share nothing");
            return;
        }

        const elementCount = tracks.map(e => e.elements).flat().length;
        if (elementCount <= 0) {
            Utils.error("Can't share nothing");
            return;
        }

        if (currentFlavorsSelected.length != 6) {
            Utils.error("Your flavor code has to be 6 flavors long");
            return;
        }

        const compiledTracks = tracks.map(track => {
            const compiledTrack = {
                volume: track.volume,
                muted: track.muted,
                solo: track.solo,
                elements: track.elements.map(element => {
                    const compiledElement = {
                        from: element.from,
                        to: element.to,
                        flavor: element.flavor.name
                    };
                    return compiledElement;
                })
            };
            return compiledTrack;
        })
        setIsLoading(true);
        const response = await (await fetch(BASE_URL + "/share/share.php", {
            method: "POST",
            body: JSON.stringify({
                jwt: user.user?.jwt ?? undefined,
                tracks: compiledTracks,
                mainFlavor: mainFlavor.mainFlavor,
                flavors: currentFlavorsSelected.sort((a, b) => a.index - b.index).map(e => e.flavor)
            })
        })).json() as APIResponse<ShareResponse, ShareErrorResponse>;

        setIsLoading(false);

        if (response.status == "error") {
            if (response.flavorComboExists) {
                Utils.error("This flavor combo already exists!");
                return;
            }
            Utils.error("Failed to publish your dish");
            return;
        }

        setShareDigits(response.dishData.code);
        // setCurrentFlavorsSelected(response.flavors.map((e, i) => ({ flavor: e, index: i })));
        setAIGeneratedImageBase64(response.dishData.aiImage);
        Utils.success("Published your dish");

        setPublished(true);
    };

    const login = async () => {
        const username = loginUsernameRef.current?.value;
        const password = loginPasswordRef.current?.value;

        setIsLoading(true);
        // const result = await (await fetch(BASE_URL + "/users/login.php", {
        //     method: "POST",
        //     body: JSON.stringify({
        //         username,
        //         password
        //     })
        // })).json() as APIResponse<LoginResponse>;

        const response = await loginUser(username ?? "", password ?? "");

        if (response) {
            user.setUser(response);
        } else {
            user.setUser(null);
        }

        setIsLoading(false);

        // if (result.status == "error") {
        //     Utils.error(result.message);
        //     return;
        // } else {
        //     Utils.success(result.message ?? "Successfully Logged in");
        //     localStorage.setItem("jwt", result.jwtData.jwt);
        //     localStorage.setItem("allowedUntil", result.jwtData.allowedUntil + "");
        //     setLoggedIn(true);
        // }
    };

    const shareAnyways = () => {
        setAcceptedUnchangable(true);
    };

    const register = async () => {
        const username = loginUsernameRef.current?.value;
        const password = loginPasswordRef.current?.value;
        const email = loginEmailRef.current?.value;

        setIsLoading(true);
        const response = await registerUser(username ?? "", password ?? "", email ?? "");
        setIsLoading(false);

        if (response) {
            user.setUser(response);
        } else {
            user.setUser(null);
        }

    };

    return <div className={"share-dialog-wrapper" + (gameState.gameState == "createDish-share" ? " visible" : "") + (!user.user && !accepedUnchangable ? " login" : "")}>
        <div role="dialog" className="share-dialog">
            <img src={BG_IMAGES.length > 0 ? BG_IMAGES[imageIdRef.current] : undefined} className="background-image" />

            <h1>Share your dish</h1>

            {
                !user.user && !accepedUnchangable && !isLoading && <>
                    <span className="disclaimer">
                        Log in to save and edit it later - or share once and move on.
                    </span>

                    <div className="center">

                        <div className="login-div">
                            <h3>{isLogin ? "Login" : "Register"}</h3>
                            {!isLogin && <input placeholder="E-Mail" type="email" className="email" ref={loginEmailRef} />}
                            <input placeholder="Username" type="text" className="username" ref={loginUsernameRef} />
                            <input placeholder="Password" type="password" className="password" ref={loginPasswordRef} />
                            <button className="login" onClick={() => isLogin ? login() : register()}>{isLogin ? "Login" : "Register"}</button>
                            <span className="dontHaveAccount">{isLogin ? "Don't have an Account?" : "Already have an Account?"} <a onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Register here" : "Login here"}</a></span>
                        </div>
                        <span className="microcopy">Edit later · Track stats · Keep ownership · AI Image for Sharing</span>

                        <div className="buttons-below-first-share">
                            <button className="share-anyways" onClick={() => shareAnyways()}>Share Anyways</button>
                            <div className="microcopy">One-time share · No edits later · No AI Image</div>
                        </div>
                    </div>

                </>
            }

            {
                isLoading && <>
                    <span className="loader"></span>
                </>
            }

            {
                ((user.user || accepedUnchangable) && !isLoading) && <>

                    <div className="share-flavors share-default-layout">
                        <h2>Share Flavor</h2>
                        <span>Share your dish with a flavor combo to match. Drag and drop flavors from the list to the side.</span>

                        <div className="combo content" onDragOver={onDragOver} onDrop={onDropFlavor} ref={comboBoxRef}>
                            {
                                Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                                    const name = getFlavorIndex(i);
                                    if (!name) {
                                        return <div key={i} className="share-flavors-flavor-no-selected">
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
                        {
                            !isPublished && <button className="publish" onClick={publish}>Publish</button>
                        }
                        {
                            isPublished && <>
                                <div className="buttons">
                                    <button className="copy-as-text" onClick={(e) => {
                                        copyTextOfFlavors(currentFlavorsSelected);
                                        if (e.target instanceof HTMLButtonElement) {
                                            (e.target as HTMLButtonElement).textContent = "Copied!";
                                            setTimeout(() => {
                                                (e.target as HTMLButtonElement).textContent = "Copy as Text";
                                            }, 2000);
                                        }
                                    }}>Copy as Text</button>
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
                            </>
                        }

                    </div>

                    <div className="share-image share-default-layout">
                        <h2>Share Image</h2>
                        <span>Share your dish with a unique AI-generated image inspired by your flavor combo.</span>
                        {
                            AIGeneratedImageBase64.length == 0 ? <div className="no-generate-image">
                                No Image generated yet.
                            </div> : <img src={AIGeneratedImageBase64} className="generate-image" alt="AI generated image"></img>
                        }

                        {
                            isPublished && <>
                                <div className="buttons">
                                    <button className="copy-as-image" onClick={(e) => {
                                        copyAIImage(AIGeneratedImageBase64);
                                        if (e.target instanceof HTMLButtonElement) {
                                            (e.target as HTMLButtonElement).textContent = "Copied!";
                                            setTimeout(() => {
                                                (e.target as HTMLButtonElement).textContent = "Copy as image";
                                            }, 2000);
                                        }
                                    }}>Copy Image</button>
                                    <button className="download-image" onClick={(e) => {
                                        downloadImage(AIGeneratedImageBase64);
                                        if (e.target instanceof HTMLButtonElement) {
                                            (e.target as HTMLButtonElement).textContent = "Downloading...";
                                            setTimeout(() => {
                                                (e.target as HTMLButtonElement).textContent = "Download Image";
                                            }, 2000);
                                        }
                                    }}>Download Image</button>
                                </div>
                            </>
                        }
                    </div>
                    <div className="share-code share-default-layout">
                        <h2>Share Code</h2>
                        <span>Share your dish with a code.</span>

                        <div className="content">
                            {
                                Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                                    const digit = shareDigits[i];
                                    return <div key={i} className="digit">{digit}</div>
                                })
                            }
                        </div>

                        {
                            shareDigits.filter(e => e != 0).length > 0 && <>
                                <div className="buttons">
                                    <button className="copy-code" onClick={(e) => {
                                        copyCode(shareDigits);
                                        if (e.target instanceof HTMLButtonElement) {
                                            (e.target as HTMLButtonElement).textContent = "Copied!";
                                            setTimeout(() => {
                                                (e.target as HTMLButtonElement).textContent = "Copy Code";
                                            }, 2000);
                                        }
                                    }}>Copy Code</button>
                                </div>
                            </>
                        }

                    </div>
                    <div className="share-url share-default-layout">
                        <h2>Share URL</h2>
                        <span>Share your dish with a url.</span>
                        <div className="content">
                            <span className="url">{shareURL}</span>
                            <button className="copy" onClick={(e) => {
                                copyShareUrl(shareURL)
                                if (e.target instanceof HTMLButtonElement) {
                                    (e.target as HTMLButtonElement).textContent = "Copied!";
                                    setTimeout(() => {
                                        (e.target as HTMLButtonElement).textContent = "Copy";
                                    }, 2000);
                                }
                            }}>Copy</button>
                        </div>
                    </div>

                </>
            }

            <div className="action-buttons">
                <button className="close" onClick={() => gameState.goBack()}>X</button>
            </div>

        </div>
    </div>;
}

function generateRandomBackgroundImage() {
    return Math.round(Math.random() * (3 - 1));
}

function copyShareUrl(url: string) {
    navigator.clipboard.writeText(url);
}

function copyCode(digit: Digit[]) {
    navigator.clipboard.writeText(digit.join(" "));
}

async function copyAIImage(base64: string) {
    const res = await fetch(base64);
    const blob = await res.blob();

    await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
    ]);
}

async function downloadImage(base64: string) {
    const a = document.createElement("a");
    a.download = "dish-image";
    a.href = base64;
    a.click();

}

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
    ]);


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

function copyTextOfFlavors(flavors: FlavorsSelected[]) {
    navigator.clipboard.writeText(flavors.map(e => e.flavor).join(", "));
}

function randomFlavor() {
    const fl = FLAVORS.map(e => e.NAME);
    return fl[Math.round(Math.random() * (fl.length - 1))];
}