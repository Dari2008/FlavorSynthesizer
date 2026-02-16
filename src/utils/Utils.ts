
import { toast } from "react-toastify";
import { v4 } from "uuid";


export default class Utils {

    private static listeners: {
        [key: string]: ResizeObserver;
    } = {};

    static {
        const unsubscribe = toast.onChange(payload => {
            if (payload.status === "added" && !Object.keys(Utils.listeners).includes(payload.id + "")) {
                requestAnimationFrame(() => {
                    const element = document.querySelector(
                        `[id='${payload.id}']`
                    ) as HTMLElement | null;
                    if (element) {
                        Utils.addResizeListener(payload.id + "", element);
                    }
                });
            }

            if (payload.status === "removed" && Object.keys(Utils.listeners).includes(payload.id + "")) {
                const element = document.querySelector(
                    `[id='${payload.id}']`
                );

                if (element) {
                    Utils.stopResizeListener(payload.id + "");
                }
            }
        });
    }

    static error(text: string) {
        toast(text, {
            data: text,
            draggable: true,
            position: "bottom-right",
            type: "error",
            style: {
                background: "linear-gradient(135deg, #ff7373, #f55454)",
                boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px rgba(232, 77, 77, 0.3)"
            }
        });


    }

    static success(text: string) {
        toast(text, {
            data: text,
            position: "bottom-right",
            type: "success",
            style: {
                background: "linear-gradient(135deg, #83ff73ff, #54f554ff)",
                boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px rgba(90, 232, 77, 0.3)",
                color: "#000"
            }
        });
    }

    static stopResizeListener(id: string) {
        if (!Utils.listeners[id]) return;
        Utils.listeners[id].disconnect();
        delete Utils.listeners[id];
    }

    static addResizeListener(id: string, element: HTMLElement) {

        const setSize = () => {
            const size = element.getBoundingClientRect();
            element.style.setProperty("--width", size.width + "px");
            element.style.setProperty("--height", size.height + "px");
        };

        Utils.listeners[id] = new ResizeObserver(() => {
            setSize();
        });

        setSize();
        Utils.listeners[id].observe(element);
    }

    static uuidv4() {
        return v4();
    }

    static uuidv4Exclude(allreadyused: string[]) {
        let uuid = null;
        do {
            uuid = v4();
        } while (allreadyused.includes(uuid));
        return uuid;
    }
}