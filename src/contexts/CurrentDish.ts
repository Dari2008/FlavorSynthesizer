import { createContext, useContext } from "react";
import { useDishes } from "./DishesContext";
import type { Dish, LocalDish } from "../@types/User";

type CurrentDishIndexContextType = {
    val: number;
    setIndex: (val: number) => void;
    openDishFromObj: (dish: Dish | LocalDish) => void;
}

export const CurrentDishIndexContext = createContext<CurrentDishIndexContextType | null>(null);

export function useCurrentDishIndex() {
    const ctx = useContext<CurrentDishIndexContextType | null>(CurrentDishIndexContext);
    if (ctx == null || ctx == null) {
        throw ("cant use useCurrentDish outside of Provider");
    }
    return ctx;
}

export function useCurrentDish() {
    const dishes = useDishes();
    const index = useCurrentDishIndex();
    if (dishes.dishes.length == 0) return undefined;
    if (index.val == -1) return undefined;
    return dishes.dishes.at(index.val) as LocalDish | Dish | undefined;
}