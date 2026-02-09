import { useEffect, useRef, useState } from "react";
import "./InitialMenu.scss";
import type { User } from "../../@types/User";
import { loginUser, registerUser } from "../../utils/UserUtils";
import { downloadAll } from "../../download/DownloadManager";
import ImageMenu from "../imageMenu/ImageMenu";
import { useGameState } from "../../contexts/GameStateContext";
import { useUser } from "../../contexts/UserContext";
import { useLoadingAnimation } from "../../contexts/LoadingAnimationContext";

export default function InitialMenu() {

    const [isDropDownOpen, setDropDownOpen] = useState<boolean>(false);
    const [isLoginOrRegister, setIsLoginOrRegsiter] = useState<"login" | "register">("login");
    const userProfileDivRef = useRef<HTMLDivElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    const gameState = useGameState();
    const user = useUser();
    const loginOrRegisterLoading = useLoadingAnimation().withKey("loginOrRegister");


    const login = async () => {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        loginOrRegisterLoading.startLoading();
        const response = await loginUser(username ?? "", password ?? "");

        if (response) {
            user.setUser(response);
        } else {
            user.setUser(null);
        }
        loginOrRegisterLoading.stopLoading();
    };

    const register = async () => {
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        const email = emailRef.current?.value;
        loginOrRegisterLoading.startLoading();

        const response = await registerUser(username ?? "", password ?? "", email ?? "");

        if (response) {
            user.setUser(response);
        } else {
            user.setUser(null);
        }
        loginOrRegisterLoading.stopLoading();
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

    const open = (e: SelectableElement) => {
        switch (e) {
            case "add":
                gameState.createNewActiveDish();
                gameState.setGameState("createDish-mainFlavor");
                break;
            case "open":
                gameState.setGameState("openShared");
                break;
            case "list":
                gameState.setGameState("dishList");
                break;
            case "none":
                gameState.setGameState("mainMenu");
                break;
        }
    };


    return <div className="main-menu">
        <h1>Flavor Synthesizer</h1>
        <span className="subtitle">Cook Up a Beat</span>
        <div className="user-profile" ref={userProfileDivRef} data-open={isDropDownOpen ? "true" : undefined}>
            <img src="./mainMenu/user-profile.png" onClick={() => setDropDownOpen(!isDropDownOpen)} className="user-icon" alt="Image of chefs hat" />
            {
                user.user != null && <>
                    <div className="dropdown">
                        <span className="label user-name">{ }</span>
                        <button className="settings" onClick={() => 0}>
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

        <ImageMenu clicked={open}></ImageMenu>

        {/* <div className="options" data-hasdownloaded={hasDownloadedAssets ? "true" : undefined}>
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
        </div> */}

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