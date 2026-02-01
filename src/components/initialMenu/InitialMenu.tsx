import { useEffect, useRef, useState } from "react";
import "./InitialMenu.scss";
import type { User } from "../../@types/User";
import { loginUser, registerUser } from "../../utils/UserUtils";
import { downloadAll } from "../../download/DownloadManager";

export default function InitialMenu({ openStateChanged, loggedInState, hasDownloadedAssets, downloadFinished, hasLoaded, selectedElementWrapper }: {
    openStateChanged: (element: SelectableElement) => void;
    loggedInState: [User | null, React.Dispatch<React.SetStateAction<User | null>>];
    downloadWrapper: [DownloadProgress, React.Dispatch<React.SetStateAction<DownloadProgress>>];
    hasDownloadedAssets: boolean; downloadFinished: () => void; hasLoaded: boolean;
    selectedElementWrapper: [SelectableElement, React.Dispatch<React.SetStateAction<SelectableElement>>];
}) {

    const [selectedElement, setSelectedElement] = selectedElementWrapper;
    const [isDropDownOpen, setDropDownOpen] = useState<boolean>(false);
    const [isLoginOrRegister, setIsLoginOrRegsiter] = useState<"login" | "register">("login");
    // const [downloadProgress, setDownloadProgres] = downloadWrapper;
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isSuccessfullDownload, setIsSuccessfullDownload] = useState<boolean>(false);
    const userProfileDivRef = useRef<HTMLDivElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const progressLabelRef = useRef<HTMLSpanElement>(null);
    const currentDownloadingProgressRef = useRef<HTMLDivElement>(null);

    const clicked = (element: SelectableElement) => {
        setSelectedElement(element);
        setTimeout(() => openStateChanged(element), 300);
    };

    const download = () => {
        if (hasDownloadedAssets) return;
        downloadAll((max, curr, maxSize, size, mbSec) => {
            // setDownloadProgres({
            //     max: max,
            //     val: curr,
            //     maxSize,
            //     size,
            //     mbSec
            // });
            console.log(max, curr, maxSize, size, mbSec);
            setIsDownloading(true);
            if (curr >= max) {
                setIsDownloading(false);
                setIsSuccessfullDownload(true);
                setTimeout(() => {
                    downloadFinished();
                }, 1000);
            }
            if (progressLabelRef.current) {
                progressLabelRef.current.textContent = `${(size / 1000 / 1000).toFixed(1)} MB / ${(maxSize / 1000 / 1000).toFixed(1)} MB (${(mbSec / 1000 / 1000).toFixed(1)} MB/s)`;
            }
            if (currentDownloadingProgressRef.current) {
                currentDownloadingProgressRef.current.style.setProperty("--progress-percentage", (size / maxSize) * 100 + "%");
            }
        });
    };

    const login = async () => {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;

        const response = await loginUser(username ?? "", password ?? "");

        if (response) {
            loggedInState[1](response);
        } else {
            loggedInState[1](null);
        }
    };

    const register = async () => {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        const email = emailRef.current?.value;

        const response = await registerUser(username ?? "", password ?? "", email ?? "");

        if (response) {
            loggedInState[1](response);
        } else {
            loggedInState[1](null);
        }

    }

    const goto = (pos: string) => {

    };

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (e.target && userProfileDivRef.current) {
                if (userProfileDivRef.current.contains(e.target as Node)) {
                    return;
                }
            }
            setDropDownOpen(false);
        };
        window.addEventListener("click", onClickOutside);
        return () => {
            window.removeEventListener("click", onClickOutside);
        }
    }, []);


    return <div className="main-menu">
        <h1>Flavor Synthesizer</h1>
        <div className="user-profile" ref={userProfileDivRef} data-open={isDropDownOpen ? "true" : undefined}>
            <img src="./mainMenu/user-profile.png" onClick={() => setDropDownOpen(!isDropDownOpen)} className="user-icon" alt="Image of chefs hat" />
            {
                loggedInState[0] != null && <>
                    <div className="dropdown">
                        <span className="label user-name">{ }</span>
                        <button className="settings" onClick={() => goto("settings")}>
                            <img src="./mainMenu/user-dropdown/settings.png" alt="Settings Icon" />
                            <span className="label">Setting</span>
                        </button>
                    </div>
                </>
                ||
                <>
                    <div className="dropdown login-dropdown">
                        <img src="./mainMenu/user-dropdown/login.png" alt="" className="login-icon" />
                        <h3>{isLoginOrRegister == "login" ? "Login" : "Register"}</h3>
                        <input type="text" placeholder={isLoginOrRegister == "login" ? "Username / E-Mail" : "Username"} className="username" ref={usernameRef} />
                        <input type="password" placeholder="Password" className="password" ref={passwordRef} />
                        {isLoginOrRegister == "register" && <input type="email" placeholder="E-Mail" className="email" ref={emailRef} />}
                        <button className="action" onClick={() => (isLoginOrRegister == "login" ? login : register)()}>{isLoginOrRegister == "login" ? "Login" : "Register"}</button>
                        {
                            isLoginOrRegister == "login" && <>
                                <span className="below">
                                    Don't have an Account?
                                    <a onClick={() => setIsLoginOrRegsiter("register")}>Register here</a>
                                </span>
                            </>
                            ||
                            <>
                                <span className="below">
                                    Already have an Account?
                                    <a onClick={() => setIsLoginOrRegsiter("login")}>Login here</a>
                                </span>
                            </>
                        }
                    </div>

                </>
            }
        </div>
        <div className="options" data-hasdownloaded={hasDownloadedAssets ? "true" : undefined}>
            <button className={"add-dish" + (selectedElement == "add" ? " selected" : "")} onClick={() => clicked("add")}>
                <img src="./mainMenu/add-dish.png" alt="A Bowl with a plus" />
                <span className="label">Create a dish</span>
            </button>
            <button className={"list-dish" + (selectedElement == "list" ? " selected" : "")} onClick={() => clicked("list")}>
                <img src="./mainMenu/dish-list.png" alt="A list with entrys" />
                <span className="label">View saved dishes</span>
            </button>
            <button className={"open-shared-dish" + (selectedElement == "open" ? " selected" : "")} onClick={() => clicked("open")}>
                <img src="./mainMenu/open-shared-dish.png" alt="A pot with the lid levetating above it" />
                <span className="label">Open a shared dish</span>
            </button>
        </div>

        {!hasDownloadedAssets && hasLoaded && <div className="has-to-download">
            <h3>Download Assets</h3>
            <span>You have to download the assets of the game if you want to play it</span>
            {!isDownloading && <button className="download" onClick={download}>Download</button>}
            {
                isDownloading && !isSuccessfullDownload && <>
                    <div className="progress-bar" role="progressbar" ref={currentDownloadingProgressRef}>
                        <div className="progress"></div>
                        <span className="label" ref={progressLabelRef}>0 MB / 0 MB (0 MB/s)</span>
                    </div>
                </>
            }
            {
                isSuccessfullDownload && <>
                    <h2 className="successfull-download">Downloaded Successfully</h2>
                </>
            }
        </div>}
    </div>;
}

export type SelectableElement = "add" | "open" | "list" | "none";
export type DownloadProgress = {
    max: number;
    val: number;
    maxSize: number;
    size: number;
    mbSec: number;
};