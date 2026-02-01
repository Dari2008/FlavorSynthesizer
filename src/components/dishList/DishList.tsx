import "./DishList.scss";

export default function DishList() {
    return <div className="dish-list">
        <h1>Dish list</h1>
        <ul className="list">
        </ul>
        <div className="options">
            <div className="top-options">
                <button className="delete">
                    <img src="" alt="" className="delete-img" />
                </button>
                <button className="share">
                    <img src="" alt="" className="share-img" />
                </button>
                <button className="duplicate">
                    <img src="" alt="" className="duplicate-img" />
                </button>
            </div>
            <button className="open">
                <img src="" alt="" className="open-img" />
                <span className="label">Open</span>
            </button>
        </div>
    </div>;
}