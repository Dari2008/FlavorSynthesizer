import type { APIResponse, LoginResponse } from "../@types/Api";
import type { User } from "../@types/User";
import { BASE_URL } from "./Statics";
import Utils from "./Utils";

export async function loginUser(username: string, password: string): Promise<User | false> {
    const result = await (await fetch(BASE_URL + "/users/login.php", {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        })
    })).json() as APIResponse<LoginResponse>;

    if (result.status == "error") {
        Utils.error(result.message);
        return false;
    } else {
        Utils.success(result.message ?? "Successfully Logged in");
        localStorage.setItem("jwt", result.jwtData.jwt);
        localStorage.setItem("allowedUntil", result.jwtData.allowedUntil + "");
        return {
            displayName: result.displayName,
            jwt: result.jwtData.jwt,
            uuid: result.uuid
        };
    }
}

export async function registerUser(username: string, password: string, email: string): Promise<User | false> {
    if (username.length <= 3) {
        Utils.error("Username is too short");
        return false;
    }
    if (password.length <= 3) {
        Utils.error("Password is too short");
        return false;
    }
    if (username.length > 20) {
        Utils.error("Username is too short");
        return false;
    }
    if (password.length > 20) {
        Utils.error("Password is too long");
        return false;
    }
    if (email.length <= 5) {
        Utils.error("Email is too short");
        return false;
    }
    if (email.length > 255) {
        Utils.error("Email is too long");
        return false;
    }
    if (!/s/g.test(email)) {
        Utils.error("Email is not valid");
        return false;
    }


    const result = await (await fetch(BASE_URL + "/users/register.php", {
        method: "POST",
        body: JSON.stringify({
            username,
            password,
            email
        })
    })).json() as APIResponse<LoginResponse>;

    if (result.status == "error") {
        Utils.error(result.message);
        return false;
    } else {
        Utils.success(result.message ?? "Successfully Registered");
        localStorage.setItem("jwt", result.jwtData.jwt);
        localStorage.setItem("allowedUntil", result.jwtData.allowedUntil + "");
        return {
            displayName: result.displayName,
            jwt: result.jwtData.jwt,
            uuid: result.uuid
        };
    }

}