import { createContext, useContext } from "react";
import type { Dish } from "../@types/User"

type DishesContextType = {
    dishes: Dish[];
    setDishes: (dishes: Dish[]) => void;
    saveDishes: () => void;
}

export const DishesContext = createContext<DishesContextType | null>(null);

export function useDishes() {
    const ctx = useContext<DishesContextType | null>(DishesContext);
    if (!ctx) {
        throw ("Cant use useDishes outside of context");
    }
    return ctx as DishesContextType;
}