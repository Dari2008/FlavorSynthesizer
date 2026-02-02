import "./DishList.scss";

export default function DishList() {
    return <div className="dish-list">
        <h1>Dish list</h1>
        <ul className="list">
        </ul>
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
    </div>;
}