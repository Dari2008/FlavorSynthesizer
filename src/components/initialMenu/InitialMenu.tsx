import { useEffect, useRef, useState } from "react";
import "./InitialMenu.scss";
import type { User } from "../../@types/User";
import { useOnClickOutside } from "usehooks-ts";
import { loginUser, registerUser } from "../../utils/UserUtils";

export default function InitialMenu({ openStateChanged, loggedInState }: { openStateChanged: (element: SelectableElement) => void; loggedInState: [User | null, React.Dispatch<React.SetStateAction<User | null>>] }) {

    const [selectedElement, setSelectedElement] = useState<SelectableElement>("none");
    const [isDropDownOpen, setDropDownOpen] = useState<boolean>(false);
    const [isLoginOrRegister, setIsLoginOrRegsiter] = useState<"login" | "register">("login");
    const userProfileDivRef = useRef<HTMLDivElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    const clicked = (element: SelectableElement) => {
        setSelectedElement(element);
        setTimeout(() => openStateChanged(element), 300);
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
        <div className="options">
            <button className={"add-dish" + (selectedElement == "add" ? " selected" : "")} onClick={() => clicked("add")}>
                <img src="./mainMenu/add-dish.png" alt="A Bowl with a plus" />
                <span className="label">Create a dish</span>
            </button>
            <button className={"list-dish" + (selectedElement == "list" ? " selected" : "")} onClick={() => clicked("list")}>
                <img src="./mainMenu/dish-list.png" alt="A list with entrys" />
                <span className="label">View saved dishes</span>
            </button>
            <button className={"open-dish-list" + (selectedElement == "open" ? " selected" : "")} onClick={() => clicked("open")}>
                <img src="./mainMenu/open-shared-dish.png" alt="A pot with the lid levetating above it" />
                <span className="label">Open a shared dish</span>
            </button>
        </div>
    </div>;
}

export type SelectableElement = "add" | "open" | "list" | "none";