import { useRef, useState } from "react"

export default function useJsObjectHook<T, E>(initialValue: T, jsonObject: E | undefined, key: keyof E, wrapper?: (val: T) => T): [T, (v: T) => void] {
    const [val, setVal] = useState<T>(initialValue);
    const setValWrapper = (v: T) => {
        if (!jsonObject) {
            setVal(wrapper ? wrapper(v) : v);
            return;
        }
        const wrappedV = wrapper ? wrapper(v) : v;
        jsonObject[key] = wrappedV as any;
        setVal(wrappedV);
    };
    return [val, setValWrapper];
}

export function useJsObjectHookForArray<T, E>(initialValue: T[], jsonObject: E | undefined, key: keyof E): [T[], (vs: T[]) => void, (v: T) => void] {
    const [vals, setVals] = useState<T[]>(initialValue);
    const setValsWrapper = (v: T[]) => {
        if (!jsonObject) {
            setVals(v);
            return;
        }
        jsonObject[key] = v as any;
        setVals(v);
    };

    const addValWrapper = (v: T) => {
        const newVals = [...vals, v];
        if (!jsonObject) {
            setVals(newVals);
            return;
        }
        jsonObject[key] = newVals as any;
        setVals(newVals);
    };

    return [vals, setValsWrapper, addValWrapper];
}

export function useJsRefObjectHook<T, E>(initialValue: T, jsonObject: E | undefined, key: keyof E, wrapper?: (val: T) => T): [React.RefObject<T>, (v: T) => void] {
    const val = useRef<T>(initialValue);
    const setValWrapper = (v: T) => {
        if (!jsonObject) {
            val.current = wrapper ? wrapper(v) : v;
            return;
        }
        const wrappedV = wrapper ? wrapper(v) : v;
        jsonObject[key] = wrappedV as any;
        val.current = wrappedV;
    };
    return [val, setValWrapper];
}