import "./DishList.scss";
import { useDishes } from "../../contexts/DishesContext";
import dayjs from "dayjs";
import customFormat from "dayjs/plugin/customParseFormat"
import { FLAVOR_IMAGES } from "../../@types/Flavors";
import { useEffect, useRef } from "react";
import type { Dish } from "../../@types/User";
import { useCurrentDish, useCurrentDishIndex } from "../../contexts/CurrentDish";
import { useGameState } from "../../contexts/GameStateContext";

dayjs.extend(customFormat);

export default function DishList() {
    const { dishes, setDishes } = useDishes();
    const currentElement = useCurrentDishIndex();
    const gameState = useGameState();

    const listRef = useRef<HTMLUListElement>(null);
    const currentSelectedElementRef = useRef<Dish>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        if (!listRef.current) return;

        const getClickedEntryElement = (element: HTMLElement) => {
            if (!element) return undefined;
            if (!listRef.current) return undefined;
            if (!listRef.current.contains(element)) return undefined;
            if (element.getAttribute("data-list-entry-name") != null) {
                return element.getAttribute("data-list-entry-name");
            }

            let currentElement: HTMLElement | null = element;

            while (currentElement?.getAttribute("data-list-entry-name") == null) {
                currentElement = currentElement?.parentElement ?? null;
                if (!currentElement) return undefined;
            }

            if (currentElement.getAttribute("data-list-entry-name") != null) {
                return currentElement.getAttribute("data-list-entry-name");
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

        const hideOptions = () => {
            if (!optionsRef.current) return;
            optionsRef.current.classList.remove("opened");
        }

        const showOptions = (x: number, y: number) => {
            if (!optionsRef.current) return;
            optionsRef.current.style.setProperty("--left", x + "px");
            optionsRef.current.style.setProperty("--top", y + "px");
            optionsRef.current.classList.add("opened");
        };

        const onMenu = (e: MouseEvent) => {

            const box = listRef.current?.getBoundingClientRect();
            if (!box) return;

            if (!(e.target instanceof HTMLElement)) {
                hideOptions();
                return;
            }

            const x = e.clientX;
            const y = e.clientY;

            const listEntryName = getClickedEntryElement(e.target);
            if (!listEntryName) {
                hideOptions();
                return;
            }

            currentSelectedElementRef.current = dishes.find(e => e.name == listEntryName) ?? null;
            showOptions(x, y);

            e.preventDefault();
        };

        window.addEventListener("contextmenu", onMenu);
        window.addEventListener("mousedown", onClickOutside);

        return () => {
            window.removeEventListener("contextmenu", onMenu);
            window.addEventListener("mousedown", onClickOutside);
        }

    }, [listRef]);

    const deleteCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        setDishes([...dishes.filter(e => e.name != currentSelectedElementRef.current?.name)]);
    };

    const shareCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const element = dishes.find(e => e.name == currentSelectedElementRef.current?.name);
        if (!element) return;
    };

    const duplicateCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const element = dishes.find(e => e.name == currentSelectedElementRef.current?.name);
        if (!element) return;

    };

    const openCurrentSelected = () => {
        if (!currentSelectedElementRef.current) return;
        const element = dishes.find(e => e.name == currentSelectedElementRef.current?.name);
        if (!element) return;
        currentElement.setIndex(dishes.indexOf(element));
    };


    return <div className={"dish-list" + (gameState.gameState == "dishList" ? " visible" : "")}>
        <div className="options" ref={optionsRef}>
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
        </div>



        <div className="top">
            <h1>Dish list</h1>
        </div>
        <div className="middle">
            {
                dishes.length > 0 && <ul className="list" ref={listRef}>
                    {
                        dishes.filter(e => !e.temporary).map(dish => {
                            return <li key={dish.name} className={dish.publishState == "private" ? "" : "public"} data-list-entry-name={dish.name}>
                                <img src={(dish.aiImage && dish.aiImage.length != 0 ? dish.aiImage : "./imgs/dishList/no-image-image.png")} alt={dish.name} className="ai-image" />
                                <span className="dish-name">{dish.name}</span>
                                <span className="dish-creation-date">{dayjs(dish.dishCreationDate).format("YYYY/MM/DD hh:mm")}</span>
                                <span className="dish-created-by">by {dish.createdBy ?? "Unknown"}</span>
                                <span className="dish-publish-state">{dish.publishState}</span>

                                {
                                    dish.publishState == "published" && dish.share && <>
                                        <div className="flavors">{
                                            dish.share.flavors.map((flavor, i) => {
                                                return <img key={flavor + i} src={FLAVOR_IMAGES[flavor]} alt={flavor} className="flavor-img" />
                                            })
                                        }</div>
                                        <div className="code">
                                            {
                                                dish.share.code.map((digit, i) => {
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