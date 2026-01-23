const dbName = "offlineResources";
const storeName = "resources";
const DB_VERSION = 1;

function openDB(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "name" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveResourceWithName(
    dbName: string,
    name: string,
    data: any
): Promise<void> {
    const db = await openDB(dbName);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        store.put({ name, data });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getResourceByName(
    dbName: string,
    name: string
): Promise<any | null> {
    const db = await openDB(dbName);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);

        const request = store.get(name);

        request.onsuccess = () => {
            resolve(request.result?.data ?? null);
        };

        request.onerror = () => reject(request.error);
    });
}


export async function hasResource(dbName: string, name: string): Promise<boolean> {
    const db = await openDB(dbName);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);

        const request = store.getKey(name);

        request.onsuccess = () => {
            resolve(request.result !== undefined);
        };

        request.onerror = () => reject(request.error);
    });
}

export async function loadAndSaveResource(
    dbName: string,
    name: string,
    pathToLoad: string
): Promise<string> {

    if (await hasResource(dbName, name)) return await getResourceByName(dbName, name);

    const response = await fetch(pathToLoad);

    const base64 = await new Promise<string>(async (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(await response.blob());
    });

    await saveResourceWithName(dbName, name, base64);

    return base64;
}