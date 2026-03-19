import { useRef, type ReactNode } from "react";
import "./ConfirmDialog.scss";
import { type ConfirmType } from "./ConfirmDialogContext";
import { InputDialogContext } from "./InputDialogContext";
import PixelButton from "../pixelDiv/PixelButton";
import PixelInput from "../pixelDiv/PixelInput";

export default function InputDialog({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const promiseResolveRef = useRef<(d: string | false) => void>(null);
    const questionRef = useRef<HTMLSpanElement>(null);
    const buttonCancelRef = useRef<HTMLButtonElement>(null);
    const buttonNoRef = useRef<HTMLButtonElement>(null);
    const buttonYesRef = useRef<HTMLButtonElement>(null);
    const buttonOkRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const response = (d: string | false) => {
        if (promiseResolveRef.current) {
            promiseResolveRef.current(d);
            promiseResolveRef.current = null;
        }
    };

    const customInput = async (text: string, type: ConfirmType = "cancelOk", inputType: React.HTMLInputTypeAttribute = "text") => {
        const promise = new Promise<string | false>((res) => {
            promiseResolveRef.current = (str) => {
                if (dialogRef.current && dialogRef.current.open) {
                    dialogRef.current.close();
                }
                res(str);
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

            if (inputRef.current) {
                inputRef.current.type = inputType;
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

    return <InputDialogContext.Provider value={{ input: customInput }}>
        <dialog className="input-dialog" ref={dialogRef}>
            <span className="question" ref={questionRef}></span>
            <div className="input">
                <PixelInput max-pixel-width={10} ref={inputRef} />
            </div>
            <div className="buttons">
                <PixelButton max-pixel-width={10} className="cancel" onClick={() => response(false)} ref={buttonCancelRef}>Cancel</PixelButton>
                <PixelButton max-pixel-width={10} className="no" onClick={() => response(false)} ref={buttonNoRef}>No</PixelButton>
                <PixelButton max-pixel-width={10} className="yes" onClick={() => response(inputRef.current?.value ?? false)} ref={buttonYesRef}>Yes</PixelButton>
                <PixelButton max-pixel-width={10} className="ok" onClick={() => response(inputRef.current?.value ?? false)} ref={buttonOkRef}>Ok</PixelButton>
            </div>
        </dialog>
        {children}
    </InputDialogContext.Provider>
}