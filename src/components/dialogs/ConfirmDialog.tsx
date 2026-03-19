import { useRef, type ReactNode } from "react";
import "./ConfirmDialog.scss";
import { ConfirmDialogContext, type ConfirmType } from "./ConfirmDialogContext";
import PixelButton from "../pixelDiv/PixelButton";

export default function ConfirmDialog({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const promiseResolveRef = useRef<(d: boolean) => void>(null);
    const questionRef = useRef<HTMLSpanElement>(null);
    const buttonCancelRef = useRef<HTMLButtonElement>(null);
    const buttonNoRef = useRef<HTMLButtonElement>(null);
    const buttonYesRef = useRef<HTMLButtonElement>(null);
    const buttonOkRef = useRef<HTMLButtonElement>(null);

    const response = (d: boolean) => {
        if (promiseResolveRef.current) {
            promiseResolveRef.current(d);
            promiseResolveRef.current = null;
        }
    };

    const customConfirm = async (text: string, type: ConfirmType = "cancelOk") => {
        const promise = new Promise<boolean>((res) => {
            promiseResolveRef.current = (d) => {
                if (dialogRef.current && dialogRef.current.open) {
                    dialogRef.current.close();
                }
                res(d);
            };

            const set = (cancel: boolean, no: boolean, yes: boolean, ok: boolean) => {
                if (buttonCancelRef.current) buttonCancelRef.current.style.display = cancel ? "" : "none";
                if (buttonNoRef.current) buttonNoRef.current.style.display = no ? "" : "none";
                if (buttonYesRef.current) buttonYesRef.current.style.display = yes ? "" : "none";
                if (buttonOkRef.current) buttonOkRef.current.style.display = ok ? "" : "none";
            }

            switch (type) {
                case "noYes":
                    set(false, true, true, false);
                    break;
                case "cancelOk":
                    set(true, false, false, true);
                    break;
                case "cancelYes":
                    set(true, false, true, false);
                    break;
            }

            if (questionRef.current) {
                questionRef.current.textContent = text;
            }

            if (dialogRef.current) {
                if (dialogRef.current.open) {
                    dialogRef.current.close();
                }
                dialogRef.current.showModal();
            }
        });
        return promise;
    };

    return <ConfirmDialogContext.Provider value={{ confirm: customConfirm }}>
        <dialog className="confirm-dialog" ref={dialogRef}>
            <span className="question" ref={questionRef}></span>
            <div className="buttons">
                <PixelButton max-pixel-width={10} className="cancel" onClick={() => response(false)} ref={buttonCancelRef}>Cancel</PixelButton>
                <PixelButton max-pixel-width={10} className="no" onClick={() => response(false)} ref={buttonNoRef}>No</PixelButton>
                <PixelButton max-pixel-width={10} className="yes" onClick={() => response(true)} ref={buttonYesRef}>Yes</PixelButton>
                <PixelButton max-pixel-width={10} className="ok" onClick={() => response(true)} ref={buttonOkRef}>Ok</PixelButton>
            </div>
        </dialog>
        {children}
    </ConfirmDialogContext.Provider>
}