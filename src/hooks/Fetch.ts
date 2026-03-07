import { useEffect, useState } from "react";
import Utils from "../utils/Utils";

type FetchState<T> = {
    data: T | null,
    loading: boolean;
    error: string | null;
}
type PromiseState = {
    loading: boolean;
    error: string | null;
}

export default function useFetch<T>(url: string, data: any, toastError: boolean = true) {
    const [loadingState, setLoadingState] = useState<FetchState<T>>({
        data: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        setLoadingState({
            data: null,
            error: null,
            loading: true
        });

        const onError = (e: any) => {
            setLoadingState({
                data: null,
                error: e + "",
                loading: false
            });

            if (toastError) {
                Utils.error(e + "");
            }

            return e;
        }

        (async () => {

            try {
                const fetchData = await (await fetch(url, {
                    method: "POST",
                    body: JSON.stringify(data)
                }).catch(onError)).json().catch(onError) as T;

                setLoadingState({
                    data: fetchData,
                    error: null,
                    loading: false
                });
            } catch (e) {
                onError(e);
            }

        })();

    }, [url]);

    return loadingState;

}

export function usePromise<T>(promiseRun: () => Promise<T>, defaultVal: T): {
    data: [T, React.Dispatch<React.SetStateAction<T>>],
    state: PromiseState
} {
    const [data, setData] = useState<T>(defaultVal);
    const [loadingState, setLoadingState] = useState<PromiseState>({
        error: null,
        loading: true
    });

    useEffect(() => {
        setLoadingState({
            error: null,
            loading: true
        });

        const onError = (e: any) => {
            setLoadingState({
                error: e + "",
                loading: false
            });

            return e;
        }

        (async () => {

            try {
                const fetchData = await promiseRun().catch(onError) as T;
                setData(fetchData);
                setLoadingState({
                    error: null,
                    loading: false
                });
            } catch (e) {
                onError(e);
            }

        })();

    }, [promiseRun]);

    return {
        data: [data, setData],
        state: loadingState
    };

}