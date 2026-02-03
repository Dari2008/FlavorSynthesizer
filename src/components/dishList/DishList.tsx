import { useEffect, useState } from "react";
import "./DishList.scss";
import type { Dish } from "../../@types/User";
import { useUser } from "../../contexts/UserContext";

export default function DishList({ openCreationMenu, onClose, isVisible }: { openCreationMenu: () => void; onClose: () => void; isVisible: boolean; }) {

    const [dishes, setDishes] = useState<Dish[]>([]);
    const user = useUser();

    useEffect(() => {
        if (user) {
            // TODO: Load dishes from server
        } else {
            // TODO: Load dishes from local storage
            const localDishes = localStorage.getItem("dishes") as Dish[] | null;
            if (localDishes) {
                setDishes(localDishes);
            }
        }
    }, []);

    return <div className={"dish-list" + (isVisible ? " visible" : "")}>
        <div className="options">
            <div className="top-options">
                <button className="delete">
                    {"\uf1f8"}
                </button>
                <button className="share">
                    {"\uf064"}
                </button>
                <button className="duplicate">
                    {"\uf24d"}
                </button>
            </div>
            <button className="open">
                <img src="" alt="" className="open-img" />
                <span className="label">Open</span>
            </button>
        </div>



        <div className="top">
            <h1>Dish list</h1>
        </div>
        <div className="middle">
            {
                dishes.length > 0 && <ul className="list">
                </ul>
            }
            {
                dishes.length == 0 && <h2>Nothing here! <a onClick={() => openCreationMenu()}>Create a Dish</a></h2>
            }
        </div>
        <div className="bottom"></div>

        <button className="close" onClick={onClose}>x</button>
    </div>;
}