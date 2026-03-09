import { useRef } from "react";
import type { Dish, LocalDish } from "../../@types/User";
import PixelDiv from "../pixelDiv/PixelDiv";
import ProgressCanvas from "../progressCanvas/ProgressCanvas";
import { FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import PixelButton from "../pixelDiv/PixelButton";
import type { Digit } from "../../@types/Api";
import PixelLI from "../pixelDiv/PixelLI";
import dayjs from "dayjs";
import { DATE_FORMAT, DISPLAY_DATE_FORMAT } from "../../utils/Statics";

export default function DishListItem({ dish, currentPlayingUUID, playDish, progressChangeRef }: { dish: Dish | LocalDish, currentPlayingUUID: string | null, playDish: (dish: Dish | LocalDish) => void; progressChangeRef?: React.RefObject<(progress: number) => void>; }) {
    const shareOptionsLiRef = useRef<HTMLLIElement>(null);
    const shareOptionsFoldout = useRef<HTMLDivElement>(null);
    const flavorsButtonRef = useRef<HTMLButtonElement>(null);
    const codeButtonRef = useRef<HTMLButtonElement>(null);
    const urlButtonRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<number>(-1);

    const hasShareOptions = dish && (dish as Dish).publishState == "public" && (dish as Dish).share;
    const defaultStruct = <>
        <PixelDiv className="ai-image">
            <img src={((dish as Dish).share && (dish as Dish).share?.aiImage && (dish as Dish).share?.aiImage.length != 0 ? (dish as Dish).share?.aiImage : "./imgs/dishList/no-image-image.png")} alt={dish.name} className="ai-image-image" />
            {
                dish.data.map(e => e.elements).flat().length > 0 &&
                <button className="image-btn" onClick={() => playDish(dish)}>
                    {
                        currentPlayingUUID == dish.uuid
                        &&
                        <img src="./imgs/actionButtons/dishList/pause.png" alt="Pause" />
                        ||
                        <img src="./imgs/actionButtons/dishList/play.png" alt="Play" />
                    }
                </button>
            }
        </PixelDiv>
        <span className="dish-name">{dish.name}</span>
        <span className="dish-creation-date">{dayjs((dish as any).createdAt, DATE_FORMAT).format(DISPLAY_DATE_FORMAT)}</span>
        <span className="dish-created-by">by {(dish as any).createdBy ?? "Unknown"}</span>
        <div className="dish-publish-state">
            {
                (dish as Dish).publishState == "private" && <img src="./imgs/actionButtons/dishList/private-badge.png" alt="Private badge" />
            }
            {
                (dish as Dish).publishState == "public" && <img src="./imgs/actionButtons/dishList/public-badge.png" alt="Public badge" />
            }
        </div>

        {
            currentPlayingUUID == dish.uuid &&
            <div className="progress-panel-wrapper">
                <ProgressCanvas className="progress-panel" color="#4E2D27" maxProgress={100} progress={0} progressChangeRef={progressChangeRef} />
                <PixelDiv className="bg"></PixelDiv>
            </div>
        }
    </>;
    if (hasShareOptions) {
        const clickedOpen = (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
            if (shareOptionsLiRef.current) {
                if (e.target instanceof Node && shareOptionsFoldout.current) {
                    if (shareOptionsFoldout.current.contains(e.target)) return;
                }

                shareOptionsLiRef.current.classList.toggle("opened");
            }
        };

        const copyCode = () => {
            copyString((dish as Dish).share?.code.join(" ") ?? "");
            showCopiedText(codeButtonRef.current);
        }

        const showCopiedText = (el: HTMLButtonElement | null) => {
            if (el) {
                if (timeoutRef.current != -1) {
                    if (flavorsButtonRef.current) flavorsButtonRef.current.textContent = "Copy"
                    if (codeButtonRef.current) codeButtonRef.current.textContent = "Copy"
                    if (urlButtonRef.current) urlButtonRef.current.textContent = "Copy"
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = -1;
                }

                el.textContent = "Copyied!"
                timeoutRef.current = setTimeout(() => {
                    if (el) el.textContent = "Copy"
                }, 2000);
            }
        }

        const copyFlavors = () => {
            copyString((dish as Dish).share?.flavors.join(", ") ?? "");
            showCopiedText(flavorsButtonRef.current);
        }

        const copyUrl = () => {
            copyString(`https://${location.hostname}/?code=${(dish as Dish).share?.code.join("")}`)
            showCopiedText(urlButtonRef.current);
        }

        const copyString = (str: string) => {
            if (!str) return;
            navigator.clipboard.writeText(str);
        }

        return <li className="dish-list-item-wrapper" data-list-entry-uuid={dish.uuid} onClick={clickedOpen} ref={shareOptionsLiRef}>
            <PixelDiv className={"dish-list-item" + (((dish as any).publishState ?? "private") == "private" ? "" : " public")} data-list-entry-uuid={dish.uuid}>
                {defaultStruct}
            </PixelDiv>
            <PixelDiv className="foldout" ref={shareOptionsFoldout}>
                <PixelDiv className="info flavors">
                    <div className="content">
                        {
                            ((dish as any).share.flavors as Flavor[]).map((flavor, i) => {
                                return <img key={flavor + i} src={FLAVOR_IMAGES[flavor]} alt={flavor} className="flavor-img" />
                            })
                        }
                    </div>
                    <div className="buttons">
                        <PixelButton onClick={copyFlavors} ref={flavorsButtonRef}>Copy</PixelButton>
                    </div>
                </PixelDiv>
                <PixelDiv className="info code">
                    <div className="content">
                        {
                            ((dish as any).share.code as Digit[]).map((digit, i) => {
                                return <span key={i} className="digit">{digit}</span>
                            })
                        }
                    </div>
                    <div className="buttons">
                        <PixelButton onClick={copyCode} ref={codeButtonRef}>Copy</PixelButton>
                    </div>
                </PixelDiv>
                <PixelDiv className="info url">
                    <div className="content">
                        {
                            "https://" + location.hostname + "/?code=" + ((dish as any).share.code as Digit[]).join("")
                        }
                    </div>
                    <div className="buttons">
                        <PixelButton onClick={copyUrl} ref={urlButtonRef}>Copy</PixelButton>
                    </div>
                </PixelDiv>
            </PixelDiv>
        </li>
    }
    return <PixelLI className={"dish-list-default-item-wrapper" + (((dish as any).publishState ?? "private") == "private" ? "" : " public")} data-list-entry-uuid={dish.uuid}>
        {defaultStruct}
    </PixelLI>;
}