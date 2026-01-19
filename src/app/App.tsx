import { useEffect, useRef, useState } from "react";
import "./App.scss";
import { FLAVORS, getFlavorByName } from "../audio/Flavors";

export default function App() {

    const [selected, setSelected] = useState("Test");

    const fl1 = getFlavorByName("Vanilla");
    const fl2 = getFlavorByName("Chocolate");
    const fl3 = getFlavorByName("Strawberry");

    return <>
        <button onClick={() => {
            fl1?.play(81);
            fl2?.play(81);
            fl3?.play(81);
        }}>Play</button>
        <select name="" id="" onChange={e => setSelected(e.target.value)}>
            {
                FLAVORS.map(e => <option key={e.NAME} value={e.NAME}>{e.NAME}</option>)
            }
        </select>
        <div className="musicPlayer">

        </div>

        <div className="flavor-container">

        </div>

        <div className="flavor-list">

        </div>

    </>
}