import { createContext, useContext } from "react";
import type { MultiplayerServer, PlayerJoined } from "../serverCommunication/ServerCommunication";
import type { ShareDigits } from "../@types/Api";
import type { ChatMessage } from "../components/multiplayerChatOverlay/MultiplayerChatOverlay";

type MultiplayerContextType = {
    isMultiplayer: boolean;
    startMultiplayer: () => void;
    managerRef: React.RefObject<MultiplayerServer | null>;
    playersJoined: PlayerJoined[];
    multiplayerCode: ShareDigits;
    setMultiplayerOverlayOpen: (open: boolean) => void;
    setMultiplayerChatOpen: (open: boolean) => void;
    isMultiplayerOverlayOpen: boolean;
    isMultiplayerChatOpen: boolean;
    joinGame: (digit: ShareDigits) => void;
    setPlayersJoined: React.Dispatch<React.SetStateAction<PlayerJoined[]>>;
    unreadChatMessageCount: number;
    setUnreadChatMessageCount: React.Dispatch<React.SetStateAction<number>>;
    setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    chatMessages: ChatMessage[];
    name: string | null;
};

export const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

export function useMultiplayer() {
    const ctx = useContext<MultiplayerContextType | null>(MultiplayerContext);
    if (!ctx) {
        throw ("Cant use Multiplayer outside of provider");
    }
    return ctx;
}