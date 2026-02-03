import { createContext, useContext } from "react";
import type { User } from "../@types/User"

export type UserContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
}

export const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
    const ctx = useContext<UserContextType | null>(UserContext);
    if (!ctx) {
        throw ("Can't use user outside of provider");
    }
    return ctx as UserContextType;
}