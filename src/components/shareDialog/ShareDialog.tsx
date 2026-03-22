import { useEffect, useRef, useState } from "react";
import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import "./ShareDialog.scss";
import { FLAVORS } from "../../audio/Flavors";
import { BASE_URL, URL_EXTENSION } from "../../utils/Statics";
import type { Digit, FlavorsSelected, ShareErrorResponse, ShareFlavors, ShareResponse } from "../../@types/Api";
import Utils from "../../utils/Utils";
import { loginUser, registerUser } from "../../utils/UserUtils";
import { useUser } from "../../contexts/UserContext";
import { useGameState } from "../../contexts/GameStateContext";
import { useCurrentDish, useCurrentDishIndex } from "../../contexts/CurrentDish";
import type { Dish, LocalDish, ServerDish } from "../../@types/User";
import PixelButton from "../pixelDiv/PixelButton";
import { Network } from "../../utils/Network";
import { useDishes } from "../../contexts/DishesContext";
import withTutorialStarter from "../../hooks/TutorialStarter";
import { getCurrentDragging } from "../flavorSynth/CurrentDraggingReference";
import PixelDiv from "../pixelDiv/PixelDiv";
import PixelInput from "../pixelDiv/PixelInput";
import PixelDivWBorder from "../pixelDiv/PixelDivWBorder";

const SHARE_FLAVOR_COMBO_LENGTH = 6;
const COPY_WIDTH_PER_FLAVOR = 80;
const GAP_BETWEEN_FLAVORS = 20;

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
    const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

    const loginEmailRef = useRef<HTMLInputElement>(null);
    const loginUsernameRef = useRef<HTMLInputElement>(null);
    const loginPasswordRef = useRef<HTMLInputElement>(null);

    const user = useUser();
    const currentDish = useCurrentDish();
    const gameState = useGameState();
    const dishes = useDishes();
    const currentDishIndex = useCurrentDishIndex();

    withTutorialStarter("editor-share");

    // const [BG_IMAGES, setBgImages] = useState<(string | undefined)[]>([]);

    // setCallbackForImageLoad([
    //     "dish.png",
    //     "fruits.png",
    //     "workbench.png"
    // ], async () => {
    //     setBgImages([
    //         await loadImage("share_dish_bg_workbench"),
    //         await loadImage("share_dish_bg_fruits"),
    //         await loadImage("share_dish_bg_dish")
    //     ]);
    // });

    useEffect(() => {

        if (!currentDish) return;

        const dish = currentDish as Dish | LocalDish;

        if (dish.type == "localDish") return;
        if (!dish.share) {
            setShareDigits([0, 0, 0, 0, 0, 0]);
            setAIGeneratedImageBase64("");
            setPublished(false);
            setCurrentFlavorsSelected([]);
            return;
        }
        setShareDigits(dish.share.code);
        setAIGeneratedImageBase64(dish.share.aiImage);
        setPublished(true);
        setCurrentFlavorsSelected(dish.share.flavors.map((flavor, i) => ({
            flavor,
            index: i
        })));

    }, [currentDish]);

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

            const flavorName = (!!e.dataTransfer.getData("flavor/plain") ? e.dataTransfer.getData("flavor/plain") : dragging?.flavor) as Flavor;
            if (!flavorName) return;
            setFlavor(index, flavorName);
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

        dishes.saveCurrentDish();

        const compiledDish = {
            name: currentDish.name,
            mainFlavor: currentDish.mainFlavor,
            volumes: currentDish.volumes,
            uuid: currentDish.uuid,
            tracks: tracks.map(track => {
                const compiledTrack = {
                    volume: track.volume,
                    muted: track.muted,
                    solo: track.solo,
                    elements: track.elements.map(element => {
                        const compiledElement = {
                            from: element.from,
                            to: element.to,
                            flavor: element.flavor
                        };
                        return compiledElement;
                    })
                };
                return compiledTrack;
            })
        } as ServerDish;
        setIsLoading(true);
        setIsGeneratingImage(true);
        const response = await Network.loadJson<ShareResponse, ShareErrorResponse>(BASE_URL + "/share/share" + URL_EXTENSION, {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
                jwt: user.user?.jwt ?? undefined,
                dish: compiledDish,
                flavors: currentFlavorsSelected.sort((a, b) => a.index - b.index).map(e => e.flavor)
            })
        });

        setIsGeneratingImage(false);
        setIsLoading(false);
        console.log(response);

        if (response.status == "error") {
            if (response.flavorComboExists) {
                Utils.error("This flavor combo already exists!");
                return;
            }
            Utils.error(response.message ?? "Failed to publish your dish");
            return;
        }

        setShareDigits(response.dishData.code);
        // setCurrentFlavorsSelected(response.flavors.map((e, i) => ({ flavor: e, index: i })));
        setAIGeneratedImageBase64(response.dishData.aiImage);
        Utils.success("Published your dish");

        setPublished(true);

        if (currentDish.type == "dish") {
            // currentDish.share = {
            //     aiImage: response.dishData.aiImage,
            //     code: response.dishData.code,
            //     flavors: currentFlavorsSelected.sort((a, b) => a.index - b.index).map(e => e.flavor) as ShareFlavors
            // };
            let uuid = "";
            dishes.setDishes(dishes => {
                const result = dishes.map(dish => {
                    if (dish.uuid != currentDish.uuid) return dish;
                    uuid = dish.uuid;
                    return {
                        ...dish,
                        uuid: (!!response.changedUUID) ? response.changedUUID : dish.uuid,
                        publishState: "public",
                        share: {
                            aiImage: response.dishData.aiImage,
                            code: response.dishData.code,
                            flavors: currentFlavorsSelected.sort((a, b) => a.index - b.index).map(e => e.flavor) as ShareFlavors
                        }
                    } as Dish;
                });
                currentDishIndex.setIndex(result.findIndex(e => e.uuid == ((!!response.changedUUID) ? response.changedUUID : uuid)));
                return result;
            });
        }


    };

    const login = async () => {
        const username = loginUsernameRef.current?.value;
        const password = loginPasswordRef.current?.value;

        setIsLoading(true);
        // const result = await Network.loadJson<APIResponse<LoginResponse>>(BASE_URL + "/users/login" + URL_EXTENSION, {
        //     method: "POST",
        // headers: [
        //     ["Content-Type", "application/json"]
        // ],
        //     body: JSON.stringify({
        //         username,
        //         password
        //     })
        // });

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
        <PixelDivWBorder max-pixel-width={40} role="dialog" className="share-dialog" >
            {/* <img src={} className="background-image" /> */}
            <PixelDiv max-pixel-width={40} className="image-bg" style={{ "--bg-image": `url(${BG_IMAGES.length > 0 ? ROOT_PATH + BG_IMAGES[imageIdRef.current] : ""})` } as any}></PixelDiv>

            <div className="content-wrapper">
                <h1>Share your dish</h1>

                {
                    !user.user && !accepedUnchangable && !isLoading && <>
                        <span className="disclaimer">
                            Log in to save and edit it later - or share once and move on.
                        </span>

                        <div className="center">

                            <div className="login-div">
                                <h3>{isLogin ? "Login" : "Register"}</h3>
                                {!isLogin && <PixelInput max-pixel-width={10} placeholder="E-Mail" type="email" className="email" ref={loginEmailRef} />}
                                <PixelInput max-pixel-width={10} placeholder="Username" type="text" className="username" ref={loginUsernameRef} />
                                <PixelInput max-pixel-width={10} placeholder="Password" type="password" className="password" ref={loginPasswordRef} />
                                <PixelButton max-pixel-width={10} className="login" onClick={() => isLogin ? login() : register()}>{isLogin ? "Login" : "Register"}</PixelButton>
                                <span className="dontHaveAccount">{isLogin ? "Don't have an Account?" : "Already have an Account?"} <a onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Register here" : "Login here"}</a></span>
                            </div>
                            <span className="microcopy">Edit later · Track stats · Keep ownership · 1x AI Image for Sharing</span>

                            <div className="buttons-below-first-share">
                                <PixelButton max-pixel-width={10} className="share-anyways" onClick={() => shareAnyways()}>Share Anyways</PixelButton>
                                <div className="microcopy">One-time share · No edits later · No AI Image</div>
                            </div>
                        </div>

                    </>
                }

                {
                    isLoading && <>
                        <span className="loader"></span>
                        {
                            isGeneratingImage && <span className="loading-subtitle">Generating Image...</span>
                        }
                    </>
                }

                {((user.user || accepedUnchangable) && !isLoading && !isPublished) &&
                    <PixelDivWBorder max-pixel-width={30} className="share-flavors share-default-layout step">
                        <h2>Set Flavor For Sharing</h2>
                        <span>Set a matching Flavor combo for your dish. Drag and Drop Flavors from the list into the fields. Then publish it. </span>

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
                        {
                            !isPublished && <PixelButton max-pixel-width={10} className="publish" onClick={publish}>Publish</PixelButton>
                        }
                    </PixelDivWBorder>
                }

                {
                    ((user.user || accepedUnchangable) && !isLoading && isPublished) && <>

                        <PixelDivWBorder max-pixel-width={30} className="share-flavors share-default-layout">

                            <h2>Flavor combo for Sharing</h2>
                            <span>This is your flavor combo to share with friends.</span>

                            <div className="combo content" ref={comboBoxRef}>
                                {
                                    Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                                        const name = getFlavorIndex(i);
                                        if (!name) {
                                            return <div key={i} className="share-flavors-flavor-no-selected" style={{ "--main-color": "#707070", "--vine-color": "#3d3d3d" } as any}>
                                                <div className="bgImage main-color"></div>
                                                <div className="bgImage main-color-2"></div>
                                                <div className="text">Drag a flavor here</div>
                                            </div>;
                                        }

                                        return <div key={i} className="share-flavors-flavor">
                                            <div className="bgImage main-color" style={{ "--main-color": FLAVOR_COLOR[name.flavor][0] } as any}></div>
                                            <div className="bgImage main-color-2" style={{ "--vine-color": FLAVOR_COLOR[name.flavor].at(-1) } as any}></div>
                                            <img src={FLAVOR_IMAGES[name.flavor]} alt={name.flavor} className="flavor-image" />
                                            <div className="text">Drag a flavor here</div>
                                        </div>
                                    })
                                }
                            </div>

                            <div className="buttons">
                                <PixelButton max-pixel-width={10} className="copy-as-text" onClick={(e) => {
                                    copyTextOfFlavors(currentFlavorsSelected);
                                    if (e.target instanceof HTMLButtonElement) {
                                        (e.target as HTMLButtonElement).textContent = "Copied!";
                                        setTimeout(() => {
                                            (e.target as HTMLButtonElement).textContent = "Copy as Text";
                                        }, 2000);
                                    }
                                }}>Copy as Text</PixelButton>
                                <PixelButton max-pixel-width={10} className="copy-as-image" onClick={(e) => {
                                    copyImageOfFlavors(currentFlavorsSelected);
                                    if (e.target instanceof HTMLButtonElement) {
                                        (e.target as HTMLButtonElement).textContent = "Copied!";
                                        setTimeout(() => {
                                            (e.target as HTMLButtonElement).textContent = "Copy as image";
                                        }, 2000);
                                    }
                                }}>Copy as image</PixelButton>
                            </div>

                        </PixelDivWBorder>


                        {
                            AIGeneratedImageBase64 && <PixelDivWBorder max-pixel-width={30} className="share-image share-default-layout">
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
                            </PixelDivWBorder>
                        }

                        <PixelDivWBorder max-pixel-width={30} className="share-code share-default-layout">
                            <h2>Share Code</h2>
                            <span>Share your dish with a code.</span>

                            <div className="content">
                                {
                                    Array.from({ length: SHARE_FLAVOR_COMBO_LENGTH }).map((_, i) => {
                                        const digit = shareDigits[i];
                                        return <PixelDiv max-pixel-width={40} key={i} className="digit">{digit}</PixelDiv>
                                    })
                                }
                            </div>

                            {
                                shareDigits.filter(e => e != 0).length > 0 && <>
                                    <div className="buttons">
                                        <PixelButton max-pixel-width={10} className="copy-code" onClick={(e) => {
                                            copyCode(shareDigits);
                                            if (e.target instanceof HTMLButtonElement) {
                                                (e.target as HTMLButtonElement).textContent = "Copied!";
                                                setTimeout(() => {
                                                    (e.target as HTMLButtonElement).textContent = "Copy Code";
                                                }, 2000);
                                            }
                                        }}>Copy Code</PixelButton>
                                    </div>
                                </>
                            }

                        </PixelDivWBorder>
                        <PixelDivWBorder max-pixel-width={30} className="share-url share-default-layout">
                            <h2>Share URL</h2>
                            <span>Share your dish with a url.</span>
                            <div className="content">
                                <span className="url">{shareURL}</span>
                                <PixelButton max-pixel-width={10} className="copy" onClick={(e) => {
                                    copyShareUrl(shareURL)
                                    if (e.target instanceof HTMLButtonElement) {
                                        (e.target as HTMLButtonElement).textContent = "Copied!";
                                        setTimeout(() => {
                                            (e.target as HTMLButtonElement).textContent = "Copy";
                                        }, 2000);
                                    }
                                }}>Copy</PixelButton>
                            </div>
                        </PixelDivWBorder>

                    </>
                }
            </div>
            <div className="action-buttons">
                <button className="close" onClick={() => gameState.goBack()}>X</button>
            </div>
        </PixelDivWBorder >
    </div >;
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


    await Promise.allSettled(allImagePromises);

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

// function randomFlavor() {
//     const fl = FLAVORS.map(e => e.NAME);
//     return fl[Math.round(Math.random() * (fl.length - 1))];
// }