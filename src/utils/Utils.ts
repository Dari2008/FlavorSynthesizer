
import { toast } from "react-toastify";
import { v4 } from "uuid";


export default class Utils {

    static error(text: string) {

        toast(text, {
            data: text,
            draggable: true,
            position: "bottom-right",
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
            style: {
                background: "linear-gradient(135deg, #83ff73ff, #54f554ff)",
                boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px rgba(90, 232, 77, 0.3)",
                color: "#000"
            }
        });
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