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