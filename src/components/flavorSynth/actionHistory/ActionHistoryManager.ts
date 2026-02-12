import type { FlavorElement } from "../PlayerTrack";
import type { FlavorSynthLine } from "../FlavorSynth";

export class ActionHistoryManager {
    private static undoActionHistory: HistoryAction[] = [];
    private static redoActionHistory: HistoryAction[] = [];

    public static reset() {
        this.undoActionHistory = [];
        this.redoActionHistory = [];
    }

    public static didAction(action: HistoryAction) {
        console.log(action);
        this.redoActionHistory = [];
        this.undoActionHistory.push(structuredClone(action));
    }

    public static undo(setSynthLines: React.Dispatch<React.SetStateAction<FlavorSynthLine[]>>) {
        const actionToUndo = this.undoActionHistory.pop();
        if (!actionToUndo) return;
        this.redoActionHistory.push(actionToUndo);
        const undo = this._undo(setSynthLines);
        switch (actionToUndo.type) {
            case "insert":
                undo.undoInsert(actionToUndo);
                break;
            case "delete":
                undo.undoDelete(actionToUndo);
                break;
            case "move":
                undo.undoMove(actionToUndo);
                break;
            case "resize":
                undo.undoResize(actionToUndo)
                break;
            case "moveBetweenTracks":
                undo.undoMoveBetweenTracks(actionToUndo);
                break;
            case "addedTrack":
                undo.undoAddedTrack(actionToUndo);
                break;
            case "removedTrack":
                undo.undoRemovedTrack(actionToUndo);
                break;
        }
    }

    public static redo(setSynthLines: React.Dispatch<React.SetStateAction<FlavorSynthLine[]>>) {
        const actionToRedo = this.redoActionHistory.pop();
        if (!actionToRedo) return;
        this.undoActionHistory.push(actionToRedo);
        const redo = this._redo(setSynthLines);
        switch (actionToRedo.type) {
            case "insert":
                redo.redoInsert(actionToRedo);
                break;
            case "delete":
                redo.redoDelete(actionToRedo);
                break;
            case "move":
                redo.redoMove(actionToRedo);
                break;
            case "resize":
                redo.redoResize(actionToRedo);
                break;
            case "moveBetweenTracks":
                redo.redoMoveBetweenTracks(actionToRedo);
                break;
            case "addedTrack":
                redo.redoAddedTrack(actionToRedo);
                break;
            case "removedTrack":
                redo.redoRemovedTrack(actionToRedo);
                break;
        }
    }

    private static _undo(setSynthLines: React.Dispatch<React.SetStateAction<FlavorSynthLine[]>>) {
        return {
            undoInsert(undo: HistoryActionInsert) {
                setSynthLines(synthLines => {
                    console.log("synthLines", structuredClone(synthLines));
                    return synthLines.map(track => {
                        if (track.uuid !== undo.trackUUID) return track;
                        return { ...track, elements: track.elements.filter(e => e.uuid !== undo.flavor.uuid) };
                    });
                });
            },

            undoDelete(undo: HistoryActionDelete) {
                setSynthLines(synthLines => synthLines.map(track => {
                    const found = undo.elements.find(e => e.trackUUID == track.uuid);
                    if (!found) return track;
                    return { ...track, elements: [...found.flavors, ...track.elements] };
                }));
            },

            undoMove(undo: HistoryActionMove) {
                setSynthLines(synthLines => synthLines.map(track => {
                    const foundTrack = undo.elements.find(e => e.trackUUID == track.uuid);
                    if (!foundTrack) return track;

                    return {
                        ...track, elements: track.elements.map(e => {
                            const flavor = foundTrack.flavors.find(s => s.flavor.uuid == e.uuid);
                            if (!flavor) return e;
                            return { ...e, from: flavor.oldFrom, to: flavor.oldTo };
                        })
                    };
                }));
            },

            undoResize(undo: HistoryActionResize) {
                setSynthLines(synthLines => synthLines.map(track => {
                    const foundTrack = undo.elements.find(e => e.trackUUID == track.uuid);
                    if (!foundTrack) return track;
                    return {
                        ...track, elements: track.elements.map(e => {
                            const flavor = foundTrack.flavors.find(s => s.flavor.uuid == e.uuid);
                            if (!flavor) return e;
                            switch (undo.axis) {
                                case "left":
                                    return { ...e, from: flavor.oldPos };
                                case "right":
                                    return { ...e, to: flavor.oldPos };
                            }
                        })
                    };
                }));
            },

            undoMoveBetweenTracks(undo: HistoryActionMoveBetweenTracks) {
                setSynthLines(synthLines => synthLines.map(track => {
                    if (track.uuid !== undo.toTrackUUID && track.uuid !== undo.fromTrackUUID) return track;
                    if (track.uuid === undo.toTrackUUID) {
                        return { ...track, elements: track.elements.filter(e => e.uuid !== undo.flavor.uuid) };
                    } else {
                        return {
                            ...track, elements: [...track.elements, {
                                ...undo.flavor,
                                from: undo.from.from,
                                to: undo.from.to
                            }]
                        };
                    }
                }));
            },

            undoAddedTrack(undo: HistoryActionAddedTrack) {
                setSynthLines(synthLines => synthLines.filter(track => track.uuid !== undo.track.uuid));
            },

            undoRemovedTrack(undo: HistoryActionRemovedTrack) {
                setSynthLines(synthLines => [...synthLines, undo.track]);
            }
        }
    }

    private static _redo(setSynthLines: React.Dispatch<React.SetStateAction<FlavorSynthLine[]>>) {
        return {
            redoInsert(redo: HistoryActionInsert) {
                setSynthLines(synthLines => {
                    const ss = synthLines.map(e => {
                        if (e.uuid !== redo.trackUUID) return e;
                        const s = { ...e, elements: [...e.elements, redo.flavor] };
                        return s;
                    });
                    console.log("synthLines", structuredClone(ss));
                    return ss;
                });
            },
            redoDelete(redo: HistoryActionDelete) {
                setSynthLines(synthLines => synthLines.map(e => {
                    const uuids = redo.elements.find(es => es.trackUUID == e.uuid)?.flavors.map(e => e?.uuid);
                    if (!uuids) return e;
                    return { ...e, elements: e.elements.filter(e => !uuids.includes(e.uuid)) };
                }));
            },
            redoMove(redo: HistoryActionMove) {
                setSynthLines(synthLines => synthLines.map(e => {
                    const foundTrack = redo.elements.find(s => s.trackUUID == e.uuid);
                    if (!foundTrack) return e;
                    return {
                        ...e, elements: e.elements.map(f => {
                            const flavor = foundTrack.flavors.find(s => s.flavor.uuid == f.uuid);
                            if (!flavor) return f;
                            return { ...f, from: flavor.newFrom, to: flavor.newTo };
                        })
                    };
                }));
            },
            redoResize(redo: HistoryActionResize) {
                setSynthLines(synthLines => synthLines.map(e => {
                    const foundTrack = redo.elements.find(s => s.trackUUID == e.uuid);
                    if (!foundTrack) return { ...e };
                    return {
                        ...e, elements: e.elements.map(f => {
                            const flavor = foundTrack.flavors.find(s => s.flavor.uuid == f.uuid);
                            if (!flavor) return f;
                            switch (redo.axis) {
                                case "left":
                                    return { ...f, from: flavor.newPos };
                                case "right":
                                    return { ...f, to: flavor.newPos };
                            }
                        })
                    };
                }));
            },
            redoMoveBetweenTracks(redo: HistoryActionMoveBetweenTracks) {
                setSynthLines(synthLines => synthLines.map(track => {
                    if (track.uuid !== redo.toTrackUUID && track.uuid !== redo.fromTrackUUID) return track;
                    if (track.uuid === redo.toTrackUUID) {
                        return { ...track, elements: [redo.flavor, ...track.elements] };
                    } else {
                        return { ...track, elements: track.elements.filter(e => e.uuid !== redo.flavor.uuid) };
                    }
                }));
            },
            redoAddedTrack(redo: HistoryActionAddedTrack) {
                setSynthLines(synthLines => [...synthLines, redo.track]);
            },
            redoRemovedTrack(redo: HistoryActionRemovedTrack) {
                setSynthLines(synthLines => synthLines.filter(e => e.uuid !== redo.track.uuid));
            }
        }
    }


}

export type HistoryAction =
    HistoryActionInsert |
    HistoryActionDelete |
    HistoryActionMove |
    HistoryActionResize |
    HistoryActionMoveBetweenTracks |
    HistoryActionAddedTrack |
    HistoryActionRemovedTrack;

type HistoryActionInsert = {
    type: "insert";
    flavor: FlavorElement;
    trackUUID: string;
};
type HistoryActionDelete = {
    type: "delete";
    elements: {
        trackUUID: string;
        flavors: FlavorElement[];
    }[];
};
type HistoryActionMove = {
    type: "move";
    elements: {
        trackUUID: string;
        flavors: {
            flavor: FlavorElement;
            oldFrom: number;
            oldTo: number;
            newFrom: number;
            newTo: number;
        }[];
    }[];
};
type HistoryActionResize = {
    type: "resize";
    elements: {
        trackUUID: string;
        flavors: {
            flavor: FlavorElement;
            oldPos: number;
            newPos: number;
        }[];
    }[];
    axis: "left" | "right";
};
type HistoryActionMoveBetweenTracks = {
    type: "moveBetweenTracks";
    fromTrackUUID: string;
    toTrackUUID: string;
    flavor: FlavorElement;
    from: {
        from: number;
        to: number;
    };
    to: {
        from: number;
        to: number;
    };
};
type HistoryActionAddedTrack = {
    type: "addedTrack";
    track: FlavorSynthLine;
};
type HistoryActionRemovedTrack = {
    type: "removedTrack";
    track: FlavorSynthLine;
};