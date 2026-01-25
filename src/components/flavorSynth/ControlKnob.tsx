import { useEffect, useEffectEvent, useRef, useState, type MouseEventHandler } from "react";
import "./ControlKnob.scss"

export default function ControlKnob({ classNames, label }: { classNames: string; label: string; }) {

    const ticksContainerRef = useRef<HTMLDivElement>(null);
    // const volumeRangeRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const volumeDisplayRef = useRef<HTMLInputElement>(null);
    const volumeDisplaySpanRef = useRef<HTMLSpanElement>(null);
    const volumeControlRef = useRef<HTMLDivElement>(null);
    const [isEditing, setE] = useState<boolean>(false);
    const isEditingRef = useRef<boolean>(false);
    const currentValueRef = useRef<number>(100);
    const currentRotation = useRef<number>(0);
    const isMouseDown = useRef<boolean>(false);
    const isMouseWithin = useRef<boolean>(false);

    const setEditing = (is: boolean) => {
        isEditingRef.current = is;
        setE(is);
    }

    const totalTicks = 40; // for a clock = 60
    const secondaryInterval = 5;
    const majorInterval = 5;// for a clock = 15


    const updateVisuals = (volume: number) => {
        if (!ticksContainerRef.current) return;
        const ticks = [...ticksContainerRef.current?.children];
        const activeTicks = Math.round((volume / 100) * totalTicks);

        ticks.forEach((tick, index) => {
            if (index < activeTicks) {
                tick.classList.add("active");
            } else {
                tick.classList.remove("active");
            }
        });

        const rotation = (volume / 100) * 270;
        if (knobRef.current) knobRef.current.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

        currentRotation.current = -rotation;
        if (volumeDisplayRef.current) volumeDisplayRef.current.style.transform = `rotate(${-rotation}deg)`;
        if (volumeDisplaySpanRef.current) volumeDisplaySpanRef.current.style.transform = `rotate(${-rotation}deg)`;

        const glowIntensity = volume / 100;
        if (knobRef.current) knobRef.current.style.boxShadow = `
                inset 4px 4px 10px rgba(0,0,0,0.7),
                inset -4px -4px 10px rgba(255,255,255,0.1),
                0 0 ${10 + glowIntensity * 20}px rgba(var(--secondary-color-rgb), ${glowIntensity})
            `;

        if (volumeDisplaySpanRef.current) volumeDisplaySpanRef.current.textContent = `${volume}%`;
        currentValueRef.current = volume;
    };

    useEffect(() => {
        updateVisuals(currentValueRef.current);
    }, []);


    const mouseDraged = (e: MouseEvent) => {
        if (!volumeControlRef.current) return;
        const box = volumeControlRef.current.getBoundingClientRect();

        const centerX = box.width / 2;
        const centerY = box.height / 2;

        const xRelative = e.clientX - box.left;
        const yRelative = e.clientY - box.top;

        let ank = xRelative - centerX;
        let gegen = yRelative - centerY;

        let hyp = Math.sqrt(Math.pow(ank, 2) + Math.pow(gegen, 2));

        ank = ank / hyp;
        gegen = gegen / hyp;
        hyp = 1;

        const angle = (Math.atan2(gegen, ank) / Math.PI * 180 + 180 - 90 + 360) % 360;

        let percentage = angle / 360 * 100;

        if (percentage > 99) {
            percentage = 100;
        }

        let val = Math.round(percentage * 10) / 10;

        currentValueRef.current = val;
        updateVisuals(val);

    };
    const mouseMoved = (e: MouseEvent) => {
        if (isMouseDown.current && !isEditingRef.current) {
            mouseDraged(e);
        }
    };

    const mouseDown = () => {
        if (!isMouseWithin.current) return;
        isMouseDown.current = true;
    };

    const mouseUp = () => {
        isMouseDown.current = false;
    };

    const mouseLeave = () => {
        isMouseWithin.current = false;
    };

    const mousEntered = () => {
        isMouseWithin.current = true;
    };

    useEffect(() => {

        window.addEventListener("mousedown", mouseDown);
        window.addEventListener("mouseup", mouseUp);
        window.addEventListener("mousemove", mouseMoved);
        window.addEventListener("click", onClickWindow);

        return () => {
            window.removeEventListener("mousedown", mouseDown);
            window.removeEventListener("mouseup", mouseUp);
            window.removeEventListener("mousemove", mouseMoved);
            window.removeEventListener("click", onClickWindow);
        };

    }, []);

    const inputChanged = (setValue: boolean) => {
        if (!volumeDisplayRef.current) return;
        let val = volumeDisplayRef.current.value;
        updateVisuals(0);
        if (!val) return;

        val = val.replaceAll(/[^\d\.,%]/g, "");
        val = val.replace(",", ".");
        val = val.replace("%", "");

        if (val.length > 4) {
            val = val.substring(0, 4);
        }


        let parsedVal = parseFloat(val);

        if (parsedVal > 100) parsedVal = 100;
        if (parsedVal < 0) parsedVal = 0;
        parsedVal = Math.round(parsedVal * 10) / 10;
        console.log(parsedVal);
        if (setValue) {
            volumeDisplayRef.current.value = parsedVal + "%";
            volumeDisplaySpanRef.current && (volumeDisplaySpanRef.current.textContent = parsedVal + "%");
        }
        updateVisuals(parsedVal);
        currentValueRef.current = parsedVal;
    };

    const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.setDragImage(new Image(), 0, 0);
    };

    const clickedLabel = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setEditing(true);
    };

    const keyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key == "Enter" || e.key == "Escape") {
            inputChanged(true);
            setEditing(false);
        }
        inputChanged(false);
    };

    const onClickWindow = (e: MouseEvent) => {
        if (isEditingRef.current) {
            if (e.target instanceof Node) {
                if (volumeDisplayRef.current && !volumeDisplayRef.current.contains(e.target as Node)) {
                    setEditing(false);
                }
            }
        }
    };


    return <div className="volume-control-wrapper">
        <div className={"volume-control " + (classNames ?? "")} ref={volumeControlRef} onDragStart={onDrag} onMouseLeave={mouseLeave} onMouseEnter={mousEntered}>
            <div className="knob" id="knob" ref={knobRef}>
                {
                    isEditing && <input className="volume-display" onKeyUp={keyPress} type="text" pattern="((\d\d\d)|(\d\d\.\d)|(\d\.\d))%?" ref={(ref) => {
                        volumeDisplayRef.current = ref;
                        if (ref) {
                            ref.value = currentValueRef.current + "%";
                            ref.style.transform = `rotate(${currentRotation.current}deg)`;
                        }
                    }}></input>
                }
                {
                    !isEditing && <span className="volume-display" onClick={clickedLabel} ref={(ref) => {
                        volumeDisplaySpanRef.current = ref;
                        if (ref) {
                            ref.textContent = currentValueRef.current + "%";
                            ref.style.transform = `rotate(${currentRotation.current}deg)`;
                        }
                    }}>50%</span>
                }
            </div>
            <div className="ticks" ref={ticksContainerRef}>
                {
                    Array.from({ length: totalTicks }).map((_, i) => {
                        const angle = (360 / totalTicks) * i;
                        return <div key={i}
                            className={`tick ${i % majorInterval === 0
                                ?
                                "major"
                                :
                                ""
                                } ${(
                                    i % secondaryInterval === 0 &&
                                    i % majorInterval !== 0
                                )
                                    ?
                                    "secondary"
                                    :
                                    ""
                                }`} style={{ transform: `rotate(${angle}deg) translate(-50%, -100%)` }}></div>
                    })
                }
            </div>
        </div>
        <span className="label">{label}</span>
    </div>;
}