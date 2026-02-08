export default function withDebounce<T extends unknown[]>(func: (...t: T) => void, time: number): (...t: T) => void {
    let lastPressed = Date.now();
    return (...t: T) => {
        const current = Date.now();
        if (current - lastPressed > time) {
            lastPressed = current;
            func(...t);
        }
    };
}