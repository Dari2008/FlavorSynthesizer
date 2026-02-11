import { useRef, useState } from "react"

export default function useJsObjectHook<T, E>(initialValue: T, jsonObject: E | undefined, key: keyof E, wrapper?: (val: T) => any): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [val, setVal] = useState<T>(initialValue);
    const setValWrapper = (v: (T) | ((t: T) => T)) => {
        if (typeof v == "function") {
            const vRes = (v as (t: T) => T)(val);
            if (!jsonObject) {
                setVal(wrapper ? wrapper(vRes) : vRes);
                return;
            }
            const wrappedV = wrapper ? wrapper(vRes) : vRes;
            jsonObject[key] = structuredClone(wrappedV) as any;
            setVal(vRes);
        } else {
            if (!jsonObject) {
                setVal(wrapper ? wrapper(v) : v);
                return;
            }
            const wrappedV = wrapper ? wrapper(v) : v;
            jsonObject[key] = structuredClone(wrappedV) as any;
            setVal(v);
        }
    };
    return [val, setValWrapper];
}

export function useJsObjectHookForArray<T, E>(initialValue: T[], jsonObject: E | undefined, key: keyof E, wrapper?: (t: T[]) => any): [T[], React.Dispatch<React.SetStateAction<T[]>>, (v: T) => void] {
    const [vals, setVals] = useState<T[]>(initialValue);
    const setValsWrapper = (v: (T[]) | ((t: T[]) => T[])) => {
        if (typeof v == "function") {
            if (!jsonObject) {
                setVals(v(vals));
                return;
            }
            const r = v(vals);
            const wrappedR = wrapper ? wrapper(r) : r;
            jsonObject[key] = structuredClone(wrappedR) as any;
            setVals(r);
        } else {
            if (!jsonObject) {
                setVals(v);
                return;
            }
            const wrappedR = wrapper ? wrapper(v) : v;
            jsonObject[key] = structuredClone(wrappedR) as any;
            setVals(v);
        }
    };

    const addValWrapper = (v: T) => {
        const newVals = [...vals, v];
        if (!jsonObject) {
            setVals(newVals);
            return;
        }
        jsonObject[key] = structuredClone(newVals) as any;
        setVals(newVals);
    };

    return [vals, setValsWrapper, addValWrapper];
}

export function useJsRefObjectHook<T, E>(initialValue: T, jsonObject: E | undefined, key: keyof E, wrapper?: (val: T) => T): [React.RefObject<T>, (f: ((v: T) => T) | T) => void] {
    const val = useRef<T>(initialValue);
    const setValWrapper = (v: T | ((t: T) => T)) => {
        if (typeof v === "function") {
            const result = (v as (t: T) => T)(val.current);
            if (!jsonObject) {
                val.current = wrapper ? wrapper(result) : result;
                return;
            }
            const wrappedV = wrapper ? wrapper(result) : result;
            jsonObject[key] = structuredClone(wrappedV) as any;
            val.current = wrappedV;
        } else {
            if (!jsonObject) {
                val.current = wrapper ? wrapper(v) : v;
                return;
            }
            const wrappedV = wrapper ? wrapper(v) : v;
            jsonObject[key] = structuredClone(wrappedV) as any;
            val.current = wrappedV;
        }
    };
    return [val, setValWrapper];
}