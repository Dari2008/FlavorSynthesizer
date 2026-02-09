import { createContext, useContext } from "react";
import type { Dish, LocalDish } from "../@types/User"

type DishesContextType = {
    dishes: (Dish | LocalDish)[];
    setDishes: (dishes: Dish[] | LocalDish[]) => void;
    saveCurrentDish: () => void;
    deleteDisheWithUUID: (uuid: string) => void;
}

export const DishesContext = createContext<DishesContextType | null>(null);

export function useDishes() {
    const ctx = useContext<DishesContextType | null>(DishesContext);
    if (!ctx) {
        throw ("Cant use useDishes outside of context");
    }
    return ctx as DishesContextType;
}