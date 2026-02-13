import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react"

export default function useJsObject<E, K extends keyof E>(
    jsonObject: E | undefined,
    key: K,
    defaultValue: E[K],
    wrapper?: (value: E[K]) => E[K]
): [E[K], React.Dispatch<React.SetStateAction<E[K]>>] {

    const initial = jsonObject?.[key];

    const [value, setValue] = useState<E[K] | undefined>(initial);

    const setValueWrapped: React.Dispatch<React.SetStateAction<E[K]>> =
        useCallback((update) => {
            setValue(prev => {
                const next =
                    typeof update === "function"
                        ? (update as (v: E[K] | undefined) => E[K])(prev)
                        : update;

                const finalValue = wrapper ? wrapper(next) : next;

                if (jsonObject) {
                    jsonObject[key] = structuredClone(finalValue) as any;
                }

                return finalValue;
            });
        }, [jsonObject, key, wrapper]);

    return [(value ?? defaultValue), setValueWrapped];
}


export function useJsObjectHookForArray<E, K extends keyof E>(
    jsonObject: E | undefined,
    key: K,
    defaultValue: (E[K] extends Array<infer T> ? T : never)[],
    wrapper?: (value: E[K]) => E[K]
): [
        (E[K] extends Array<infer T> ? T : never)[],
        Dispatch<SetStateAction<(E[K] extends Array<infer T> ? T : never)[]>>,
        (item: E[K] extends Array<infer T> ? T : never) => void
    ] {

    type Item = E[K] extends Array<infer T> ? T : never;
    type ArrayType = Item[];

    const initial = (jsonObject?.[key] ?? []) as ArrayType;

    const [values, setValues] = useState<ArrayType>(initial);

    const setValuesWrapped: React.Dispatch<React.SetStateAction<ArrayType>> =
        useCallback((update) => {
            setValues(prev => {
                const next =
                    typeof update === "function"
                        ? (update as (v: ArrayType) => ArrayType)(prev)
                        : update;

                const finalValue = wrapper ? wrapper(next as any) : next;

                if (jsonObject) {
                    jsonObject[key] = structuredClone(finalValue) as any;
                }

                return finalValue as ArrayType;
            });
        }, [jsonObject, key, wrapper]);

    const add = useCallback((item: Item) => {
        setValuesWrapped(prev => [...prev, item]);
    }, [setValuesWrapped]);

    return [values ?? defaultValue, setValuesWrapped, add];
}



export function useJsRefObjectHook<E, K extends keyof E>(
    jsonObject: E | undefined,
    key: K,
    defaultValue: E[K],
    wrapper?: (value: E[K]) => E[K]
): [
        React.RefObject<E[K]>,
        (update: React.SetStateAction<E[K]>) => void
    ] {

    const ref = useRef<E[K]>(jsonObject?.[key] ?? defaultValue);

    const set = useCallback((update: React.SetStateAction<E[K]>) => {
        const next =
            typeof update === "function"
                ? (update as (v: E[K] | undefined) => E[K])(ref.current)
                : update;

        const finalValue = wrapper ? wrapper(next) : next;

        console.log("finalValue", finalValue, jsonObject);

        ref.current = finalValue;

        if (jsonObject) {
            jsonObject[key] = structuredClone(finalValue) as any;
        }

    }, [jsonObject, key, wrapper]);

    return [ref, set];
}



export function useJsRefObjectWithFunctionHook<E>(
    setVal: (e: E) => void,
    defaultValue: E,
    wrapper?: (value: E) => E
): [
        React.RefObject<E>,
        (update: React.SetStateAction<E>) => void
    ] {

    const ref = useRef<E>(defaultValue);

    const set = useCallback((update: React.SetStateAction<E>) => {
        const next =
            typeof update === "function"
                ? (update as (v: E | undefined) => E)(ref.current)
                : update;

        const finalValue = wrapper ? wrapper(next) : next;

        ref.current = finalValue;

        setVal(structuredClone(finalValue));

    }, [setVal, wrapper]);

    return [ref, set];
}
