import "./DishList.scss";
import { useDishes } from "../../contexts/DishesContext";
import dayjs from "dayjs";
import customFormat from "dayjs/plugin/customParseFormat"
import { FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import { useEffect, useRef } from "react";
import type { Dish, LocalDish } from "../../@types/User";
import { useCurrentDish, useCurrentDishIndex } from "../../contexts/CurrentDish";
import { useGameState } from "../../contexts/GameStateContext";
import type { Digit } from "../../@types/Api";
import PixelDiv from "../pixelDiv/PixelDiv";

dayjs.extend(customFormat);

export default function DishList() {
    const { dishes, deleteDisheWithUUID } = useDishes();
    const currentElement = useCurrentDishIndex();
    const gameState = useGameState();

    const listRef = useRef<HTMLUListElement>(null);
    const lastClickOffsetRef = useRef({ x: 0, y: 0 });
    const currentSelectedElementRef = useRef<Dish | LocalDish>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const dishListRef = useRef<HTMLDivElement>(null);

    const hideOptions = () => {
        if (!optionsRef.current) return;
        optionsRef.current.classList.remove("opened");
    }

    const showOptions = (x: number, y: number) => {
        y += (dishListRef.current?.scrollTop ?? 0);
        if (!optionsRef.current) return;
        optionsRef.current.style.setProperty("--left", x + "px");
        optionsRef.current.style.setProperty("--top", y + "px");
        optionsRef.current.classList.add("opened");
    };

    const getClickedEntryElement = (element: HTMLElement) => {
        if (!element) return undefined;
        if (!listRef.current) return undefined;
        if (!listRef.current.contains(element)) return undefined;
        if (element.getAttribute("data-list-entry-uuid") != null) {
            return element.getAttribute("data-list-entry-uuid");
        }

        let currentElement: HTMLElement | null = element;

        while (currentElement?.getAttribute("data-list-entry-uuid") == null) {
            currentElement = currentElement?.parentElement ?? null;
            if (!currentElement) return undefined;
        }

        if (currentElement.getAttribute("data-list-entry-uuid") != null) {
            return currentElement.getAttribute("data-list-entry-uuid");
        }

        return undefined;
    }

    const onClickOutside = (e: MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) {
            hideOptions();
            return;
        }

        if (optionsRef.current?.contains(e.target) === true) return;
        if (listRef.current?.contains(e.target) && e.button != 0) return;
        hideOptions();
    };

    const onMenu = (e: MouseEvent) => {

        const box = listRef.current?.getBoundingClientRect();
        if (!box) return;

        if (!(e.target instanceof HTMLElement)) {
            hideOptions();
            return;
        }

        const x = e.clientX - lastClickOffsetRef.current.x;
        const y = e.clientY - lastClickOffsetRef.current.y;

        const listEntryUUID = getClickedEntryElement(e.target);
        if (!listEntryUUID) {
            hideOptions();
            e.preventDefault();
            return;
        }
        currentSelectedElementRef.current = dishes.find(e => e.uuid == listEntryUUID) ?? null;
        showOptions(x, y);

        e.preventDefault();
    };

    const onClickInsideMenu = (e: MouseEvent) => {
        const box = optionsRef.current?.getBoundingClientRect();
        if (!box) return;

        if (!(e.target instanceof HTMLElement)) {
            return;
        }

        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        if (x < 0 || y < 0) {
            lastClickOffsetRef.current = { x: 0, y: 0 };
            return;
        }
        lastClickOffsetRef.current = { x, y };
    };

    useEffect(() => {
        optionsRef.current?.addEventListener("mousedown", onClickInsideMenu);
        window.addEventListener("contextmenu", onMenu);
        window.addEventListener("mousedown", onClickOutside);

        return () => {
            window.removeEventListener("contextmenu", onMenu);
            window.removeEventListener("mousedown", onClickOutside);
            optionsRef.current?.removeEventListener("mousedown", onClickInsideMenu);
        }

    }, []);

    const deleteCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const uuid = dishes.find(e => e.uuid == currentSelectedElementRef.current?.uuid)?.uuid;
        if (!uuid) return;
        deleteDisheWithUUID(uuid);
        hideOptions();
    };

    const shareCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const element = currentSelectedElementRef.current;
        if (!element) return;

        const indexOf = dishes.indexOf(element);
        if (indexOf == -1) return;

        currentElement.setIndex(indexOf);
        gameState.setGameState("createDish-share");

        hideOptions();
    };

    const duplicateCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const element = currentSelectedElementRef.current;
        if (!element) return;

        const indexOf = dishes.indexOf(element);

        let index = 1;
        let newName = element.name + ` (${index})`;

        const names = dishes.map(e => e.name);

        while (names.includes(newName)) {
            index++;
            newName = element.name + ` (${index})`;
        }

        let newUUID = crypto.randomUUID();

        const uuids = dishes.map(e => e.uuid);

        while (uuids.includes(newUUID)) {
            newUUID = crypto.randomUUID();
        }

        const newDish = {
            ...element,
            uuid: newUUID,
            name: newName,
            shares: undefined,
            aiImage: undefined
        };
        gameState.createNewActiveDish(newDish, false, indexOf == -1 ? undefined : indexOf);

        hideOptions();
    };

    const openCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        // currentElement.setIndex((dishes as any[]).indexOf(currentSelectedElementRef.current));
        currentElement.openDishFromObj(currentSelectedElementRef.current);
        gameState.setGameState("createDish-create");
        hideOptions();
    };

    return <div className={"dish-list" + (gameState.gameState == "dishList" ? " visible" : "")} ref={dishListRef}>
        <PixelDiv className="options" ref={optionsRef}>
            <div className="top-options">
                <button className="delete" onClick={deleteCurrentSelected}>
                    {"\uf1f8"}
                </button>
                <button className="share" onClick={shareCurrentSelected}>
                    {"\uf064"}
                </button>
                <button className="duplicate" onClick={duplicateCurrentSelected}>
                    {"\uf24d"}
                </button>
            </div>
            <button className="open" onClick={openCurrentSelected}>
                <img src="" alt="" className="open-img" />
                <span className="label">Open</span>
            </button>
        </PixelDiv>



        <div className="top">
            <h1>Dish list</h1>
        </div>
        <div className="middle">
            {
                dishes.length > 0 && <ul className="list" ref={listRef}>
                    {
                        dishes.filter(e => !(e as any).temporary).map((dish, i) => {
                            return <li key={dish.name + i} className={((dish as any).publishState ?? "private") == "private" ? "" : "public"} data-list-entry-uuid={dish.uuid}>
                                <img src={((dish as any).aiImage && (dish as any).aiImage.length != 0 ? (dish as any).aiImage : "./imgs/dishList/no-image-image.png")} alt={dish.name} className="ai-image" />
                                <span className="dish-name">{dish.name}</span>
                                <span className="dish-creation-date">{dayjs((dish as any).dishCreationDate).format("YYYY/MM/DD hh:mm")}</span>
                                <span className="dish-created-by">by {(dish as any).createdBy ?? "Unknown"}</span>
                                <span className="dish-publish-state">{(dish as any).publishState}</span>

                                {
                                    dish && (dish as Dish).publishState == "published" && (dish as Dish).share && <>
                                        <div className="flavors">{
                                            ((dish as any).share.flavors as Flavor[]).map((flavor, i) => {
                                                return <img key={flavor + i} src={FLAVOR_IMAGES[flavor]} alt={flavor} className="flavor-img" />
                                            })
                                        }</div>
                                        <div className="code">
                                            {
                                                ((dish as any).share.code as Digit[]).map((digit, i) => {
                                                    return <span key={i} className="digit">{digit}</span>
                                                })
                                            }
                                        </div>
                                    </>
                                }
                                <div className="bg">
                                    <div className="left"></div>
                                    <div className="center"></div>
                                    <div className="right"></div>
                                </div>
                            </li>
                        })
                    }
                </ul>
            }
            {
                dishes.length == 0 && <h2>Nothing here! <a onClick={() => gameState.setGameState("createDish-mainFlavor")}>Create a Dish</a></h2>
            }
        </div>
        <div className="bottom"></div>

        <button className="close" onClick={gameState.goBack}>x</button>
    </div>;
}