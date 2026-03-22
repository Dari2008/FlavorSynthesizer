import { useRef, useState } from "react";
import type { Digit } from "../../@types/Api";
import { useMultiplayer } from "../../contexts/MultiplayerContext";
import PixelButton from "../pixelDiv/PixelButton";
import PixelDiv from "../pixelDiv/PixelDiv";
import "./MultiplayerSettingsOverlay.scss";
import type { PlayerJoined, PlayJoinScope } from "../../serverCommunication/ServerCommunication";
import Toggle from "../toggle/Toggle";
import PixelDivWBorder from "../pixelDiv/PixelDivWBorder";

export default function MultiplayerSettingsOverlay() {
    const multiplayer = useMultiplayer();
    const code = multiplayer.multiplayerCode;
    const usersJoined = multiplayer.playersJoined;

    const copyCodeRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    multiplayer.manager?.getServerCommunication().onPlayerLeft.add("MultiplayerSettingsOverlay", (player) => {
        multiplayer.setPlayersJoined(players => players.filter(e => e.endpointUUID !== player.endpointUUID));
    });

    return multiplayer.isMultiplayer && multiplayer.manager?.isOwner() && <>
        <div className="multiplayer-settings-overlay" data-visible={multiplayer.isMultiplayerOverlayOpen ? true : undefined}>
            <div className="bg"></div>
            <PixelDivWBorder max-pixel-width={40} className="dialog" role="dialog">

                <button className="close" onClick={() => multiplayer.setMultiplayerOverlayOpen(false)}>x</button>

                <div className="scroll-wrapper">
                    <h2>Meeting Settings</h2>
                    <p>Here you can manage all joined players as well as view the code to invite people</p>

                    <div className="code-preview">
                        <div className="digits">
                            {
                                code.map((digit, i) => <PixelDiv key={i} max-pixel-width={20} className="digit">{digit}</PixelDiv>)
                            }
                        </div>
                        <PixelButton max-pixel-width={15} className="copy" ref={copyCodeRef} onClick={() => {
                            copyCode(code);
                            if (!copyCodeRef.current) return;

                            if (timeoutRef.current != null) {
                                clearTimeout(timeoutRef.current);
                            }
                            timeoutRef.current = setTimeout(() => {
                                if (!copyCodeRef.current) return;
                                copyCodeRef.current.innerHTML = copyCodeRef.current.innerHTML.replace("Copied!", "Copy");
                            }, 2000);
                            copyCodeRef.current.innerHTML = copyCodeRef.current.innerHTML.replace("Copy", "Copied!");
                        }}>Copy</PixelButton>
                    </div>
                    <h2 className="cooks">Cooks</h2>
                    <ul className="people-list">
                        {
                            usersJoined.map(player => {
                                const kick = () => {
                                    multiplayer.manager?.getServerCommunication().kick(player.endpointUUID);
                                    multiplayer.setPlayersJoined(playerJoined => {
                                        return playerJoined.filter(e => e.endpointUUID !== player.endpointUUID);
                                    })
                                };

                                const mute = (is: boolean) => {
                                    multiplayer.manager?.getServerCommunication().mute(player.endpointUUID, is);
                                    multiplayer.setPlayersJoined(playerJoined => {
                                        return playerJoined.map(lPlayer => {
                                            if (lPlayer.endpointUUID !== player.endpointUUID) return lPlayer;
                                            return {
                                                ...lPlayer,
                                                muted: true
                                            }
                                        })
                                    })
                                }

                                const viewOnly = (is: boolean) => {
                                    multiplayer.manager?.getServerCommunication().viewOnly(player.endpointUUID, is);
                                    multiplayer.setPlayersJoined(playerJoined => {
                                        return playerJoined.map(lPlayer => {
                                            if (lPlayer.endpointUUID !== player.endpointUUID) return lPlayer;
                                            return {
                                                ...lPlayer,
                                                viewOnly: true
                                            }
                                        })
                                    })
                                }

                                return <li className="player-item" key={player.endpointUUID}>
                                    <span className="name">{player.name}</span>
                                    {
                                        multiplayer.manager?.isOwner() && <>
                                            <Toggle className="mute" onToggleChange={mute}>Mute</Toggle>
                                            <Toggle className="viewOnly" onToggleChange={viewOnly}>View Only</Toggle>
                                            <PixelButton max-pixel-width={10} className="kick" onClick={kick}>Kick</PixelButton>
                                        </>
                                    }
                                </li>
                            })
                        }
                        {
                            usersJoined.length == 0 && <p className="nobodyhere">Pretty empty here...</p>
                        }
                    </ul>
                </div>

            </PixelDivWBorder>
        </div>
        <PlayerJoinNotification />
    </> || <PlayerJoinNotification />
}

function PlayerJoinNotification() {

    const multiplayer = useMultiplayer();

    const allowCallback = useRef<(value: PlayJoinScope | PromiseLike<PlayJoinScope>) => void>(null);
    const isMuted = useRef<boolean>(false);
    const isViewOnly = useRef<boolean>(false);

    const [userJoined, setUserJoined] = useState<PlayerJoined | null>(null);

    if (!multiplayer.manager) return <></>;

    multiplayer.manager.getServerCommunication().onPlayerJoin = async (_: number, playerJoined: PlayerJoined) => {
        return await new Promise<PlayJoinScope>(async (res) => {
            setUserJoined(playerJoined);

            const userResponse = await new Promise<PlayJoinScope>((res) => {
                const timeout = setTimeout(() => {
                    res({
                        kick: true,
                        muted: false,
                        viewOnly: false
                    });
                }, 10000);

                allowCallback.current = (r) => {
                    clearTimeout(timeout);
                    res(r);
                };
            });
            setUserJoined(null);


            if (userResponse.kick) {
                res(userResponse);
                return;
            }

            multiplayer.setPlayersJoined(players => [...players, {
                ...playerJoined,
                ...userResponse
            }]);
            res(userResponse);
        });
    };

    const onMutedChange = (checked: boolean) => {
        isMuted.current = checked;
    };

    const onViewOnlyChange = (checked: boolean) => {
        isViewOnly.current = checked;
    };

    const deny = () => {
        allowCallback.current?.({
            kick: true,
            muted: false,
            viewOnly: false
        });
    }

    const allow = () => {
        allowCallback.current?.({
            kick: false,
            muted: isMuted.current,
            viewOnly: isViewOnly.current
        });
    }

    return userJoined && <>
        <PixelDivWBorder max-pixel-width={30} className="player-join-notification">
            <span className="title">Player Joined</span>
            <span className="name">{userJoined.name}</span>
            <div className="details">
                <Toggle onToggleChange={onMutedChange}>Muted</Toggle>
                <Toggle onToggleChange={onViewOnlyChange}>View Only</Toggle>
            </div>

            <div className="buttons">
                <PixelButton max-pixel-width={10} className="deny" onClick={deny}>Deny</PixelButton>
                <PixelButton max-pixel-width={10} className="allow" onClick={allow}>Allow</PixelButton>
            </div>
        </PixelDivWBorder>
    </>
}



function copyCode(digit: Digit[]) {
    navigator.clipboard.writeText(digit.join(" "));
}