export default function withDebounce<T extends unknown[], E>(func: (...t: T) => E, time: number): (...t: T) => E | null {
    let lastPressed = Date.now() - time;
    return (...t: T) => {
        const current = Date.now();
        if (current - lastPressed > time) {
            lastPressed = current;
            return func(...t);
        }
        return null;
    };
}

export function withTimeoutDebounce<T extends unknown[]>(func: (...t: T) => void, time: number): (...t: T) => void | null {
    let timeout = -1;
    return (...t: T) => {
        if (timeout != -1) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...t)
        }, time);
    };
}