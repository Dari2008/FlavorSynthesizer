import { useEffect, useRef, useState } from "react";
import { useMultiplayer } from "../../contexts/MultiplayerContext";
import PixelButton from "../pixelDiv/PixelButton";
import PixelDiv from "../pixelDiv/PixelDiv";
import "./MultiplayerChatOverlay.scss";
import Utils from "../../utils/Utils";
import PixelTextArea from "../pixelDiv/PixelTextArea";
import dayjs from "dayjs";
import type { UUID } from "../../@types/User";
import PixelDivWBorder from "../pixelDiv/PixelDivWBorder";

export default function MultiplayerChatOverlay() {
    const multiplayer = useMultiplayer();
    const [canSend, setCanSend] = useState<boolean>(false);
    const [currentlySending, setCurrentlySending] = useState<UUID[]>([]);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        multiplayer.setUnreadChatMessageCount(0);
    }, [multiplayer.isMultiplayerChatOpen]);

    const checkCanSend = () => {
        const val = inputRef.current?.value;
        if (!val || val.trim().length == 0) {
            setCanSend(false);
            return;
        }
        setCanSend(true);
    }

    const sendMessage = async () => {
        if (multiplayer.isMultiplayerMuted) return;
        const messageContent = inputRef.current?.value;
        if (!messageContent) return;
        if (messageContent.trim().length == 0) return;

        if (multiplayer.managerRef.current) {

            const time = Date.now();
            const uuid = Utils.uuidv4();


            setCurrentlySending(sending => [...sending, uuid]);
            multiplayer.setChatMessages(messages => [...messages, {
                message: messageContent,
                sender: multiplayer.name ?? "Unknown",
                time: time,
                uuid: uuid,
                own: true
            }]);
            if (inputRef.current) inputRef.current.value = "";

            const success = await multiplayer.managerRef.current.getServerCommunication().sendMessage(messageContent, time, uuid);
            if (!success) return;

            setCurrentlySending(sending => sending.filter(e => e !== uuid));

        } else {
            Utils.error("Failed to send message try again later");
            return;
        }
    }

    return multiplayer.isMultiplayer && <div className="multiplayer-chat-overlay" data-visible={multiplayer.isMultiplayerChatOpen ? true : undefined}>
        <div className="bg"></div>
        <PixelDivWBorder max-pixel-width={40} className="dialog" role="dialog">
            <button className="close" onClick={() => multiplayer.setMultiplayerChatOpen(false)}>x</button>
            <h2>Chat</h2>
            <div max-pixel-width={40} className="messages">
                {
                    multiplayer.chatMessages.map(message => {
                        return <Message key={message.uuid} isCurrentlySending={currentlySending.includes(message.uuid)} message={message}></Message>
                    })
                }
            </div>
            <div className="message-bg"></div>
            <PixelDiv max-pixel-width={40} className="sendMessage" data-is-muted={multiplayer.isMultiplayerMuted ? true : undefined}>
                <PixelTextArea ref={inputRef} placeholder="Write a message..." onInput={checkCanSend} onChange={checkCanSend} className="input"></PixelTextArea>
                <PixelButton onClick={sendMessage} disabled={!canSend}>Send</PixelButton>
            </PixelDiv>
        </PixelDivWBorder>
    </div>
}

function Message({ message, isCurrentlySending }: { message: ChatMessage; isCurrentlySending: boolean }) {
    return <PixelDiv max-pixel-width={40} className={"message" + (message.own ? " own" : "") + (isCurrentlySending ? " currently-sending" : "")}>
        <div className="bg"></div>
        <span className="sender">{message.sender}</span>
        <span className="message">{message.message}</span>
        <span className="time">{dayjs(message.time).format("HH:mm:ss")}</span>
    </PixelDiv>
}

export type ChatMessage = {
    sender: string;
    message: string;
    time: number;
    uuid: UUID;
    own?: boolean;
}