import { useState, type ReactNode } from "react";
import "./Toggle.scss";

export default function Toggle({ checked = false, children, onToggleChange, setToggledRef, className }: { checked?: boolean; children: ReactNode; onToggleChange: (val: boolean) => void; setToggledRef?: React.RefObject<(val: boolean) => void>; className?: string }) {

    const [toggled, setToggled] = useState<boolean>(checked);

    if (setToggledRef) setToggledRef.current = setToggled;

    const toggleStateChanged = () => {
        setToggled(!toggled);
        onToggleChange(!toggled);
    };

    return <div className={"toggle-wrapper " + className}>
        <label htmlFor=".toggle-element">{children}</label>
        <div className={"toggle" + (toggled ? " toggled" : "")} role="checkbox">
            <div className="toggle-head"></div>
            <div className="progress-darken"></div>
            <input type="checkbox" className="toggle-element" onChange={toggleStateChanged} />

        </div>
    </div>
}