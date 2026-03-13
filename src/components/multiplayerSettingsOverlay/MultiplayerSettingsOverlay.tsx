import { useMultiplayer } from "../../contexts/MultiplayerContext";
import PixelDiv from "../pixelDiv/PixelDiv";
import "./MultiplayerSettingsOverlay.scss";

export default function MultiplayerSettingsOverlay() {
    const multiplayer = useMultiplayer();
    const code = multiplayer.multiplayerCode;
    const usersJoined = multiplayer.playersJoined;
    return multiplayer.isMultiplayer && multiplayer.managerRef.current?.isOwner() && <div className="multiplayer-settings-overlay" data-visible={multiplayer.isMultiplayerOverlayOpen ? true : undefined}>
        <div className="bg"></div>
        <PixelDiv max-pixel-width={40} className="dialog" role="dialog">
            <h2>Meeting Settings</h2>
            <p>Here you can manage all joined players as well as view the code to invite people</p>

            <button className="close" onClick={() => multiplayer.setMultiplayerOverlayOpen(false)}>x</button>


            <div className="code-preview">
                {
                    code.map((digit, i) => <PixelDiv key={i} max-pixel-width={30} className="digit">{digit}</PixelDiv>)
                }
            </div>

            <ul className="people-list">
                {
                    usersJoined.map(player => {
                        const kick = () => {
                            multiplayer.managerRef.current?.getServerCommunication().kick(player.endpointUUID);
                        };

                        const mute = () => {
                            multiplayer.managerRef.current?.getServerCommunication().mute(player.endpointUUID);
                        }

                        return <li className="player-item" key={player.endpointUUID}>
                            <span className="name">{player.name}</span>
                            {
                                multiplayer.managerRef.current?.isOwner() && <>
                                    <button className="mute" onClick={mute}>Mute in chat</button>
                                    <button className="kick" onClick={kick}>Kick</button>
                                </>
                            }
                        </li>
                    })
                }
                {
                    usersJoined.length == 0 && <p className="nobodyhere">Pretty empty here...</p>
                }
            </ul>
        </PixelDiv>
    </div>
}