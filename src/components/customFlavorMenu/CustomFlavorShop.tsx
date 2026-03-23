import { useEffect, useRef, useState } from "react";
import PixelDivWBorder from "../pixelDiv/PixelDivWBorder";
import { addCustomFlavor, type CustomFlavor } from "../addCustomFlavor/CustomFlavorManager";
import PublicFlavorLoader from "./PublicFlavorLoader";
import Skeleton from "react-loading-skeleton";
import { useUser } from "../../contexts/UserContext";
import { useCustomFlavors } from "../../contexts/CustomFlavors";
import { CustomFlavorMusic } from "../../audio/FlavorMusic";
import type { Flavor } from "../../@types/Flavors";
import * as Tone from "tone";

export default function CustomFlavorShop({ onClose }: { onClose: () => void }) {

    const [isLoading, setLoading] = useState<boolean>(true);
    const [customFlavors, setCustomFlavors] = useState<CustomFlavor[]>([]);
    const [currentPage, _setCurrentPage] = useState<number>(0);
    const user = useUser();
    const customFlavorsOptions = useCustomFlavors();

    const currentPlayingRef = useRef<CustomFlavorMusic>(null);

    const stopCallbacks: {
        [key: string]: () => void;
    } = {};

    useEffect(() => {
        (async () => {
            if (customFlavors.length != 0) return;
            setLoading(true);
            const flavors = await PublicFlavorLoader.loadPublicFlavors(currentPage);
            setCustomFlavors(flavors);
            setLoading(false);
        })();
    }, [currentPage]);

    const playCustomFlavor = async (flavor: CustomFlavor) => {
        stopAllPlaying();
        const player = new CustomFlavorMusic(flavor.audio, flavor.name as Flavor, flavor.colors, flavor.image);
        currentPlayingRef.current = player;
        await player.playSegment(0, 0, 5);
        Tone.getTransport().start();
        Tone.getTransport().stop(5);
    }

    const downloadCustomFlavor = (flavor: CustomFlavor) => {
        addCustomFlavor(user.user, flavor, customFlavorsOptions);
    };

    const stopAllPlaying = () => {
        currentPlayingRef.current?.stopAllBpms();
        Object.values(stopCallbacks).forEach(e => e());
    };

    const addStopCallback = (key: string, callback: () => void) => {
        stopCallbacks[key] = callback;
    }

    return <div className="custom-flavor-shop-wrapper">
        <div className="bg"></div>
        <PixelDivWBorder max-pixel-width={30} className="custom-flavor-shop">
            <button className="close" onClick={onClose}>x</button>
            <h2>Custom Flavor Shop</h2>
            <div className="flavors">

                {
                    isLoading && <>
                        <Skeleton count={4} containerClassName="custom-flavor skeleton" enableAnimation inline></Skeleton>
                        <Skeleton count={4} containerClassName="custom-flavor skeleton" enableAnimation inline></Skeleton>
                        <Skeleton count={4} containerClassName="custom-flavor skeleton" enableAnimation inline></Skeleton>
                        <Skeleton count={4} containerClassName="custom-flavor skeleton" enableAnimation inline></Skeleton>
                        <Skeleton count={4} containerClassName="custom-flavor skeleton" enableAnimation inline></Skeleton>
                        <Skeleton count={4} containerClassName="custom-flavor skeleton" enableAnimation inline></Skeleton>
                        <div className="loading"></div>
                    </>
                }

                {
                    !isLoading && <>
                        {
                            customFlavors.map(flavor => {
                                return <CustomFlavorShopItem flavor={flavor} playCustomFlavor={() => playCustomFlavor(flavor)} downloadCustomFlavor={() => downloadCustomFlavor(flavor)} addStopCallback={addStopCallback} stopAllPlaying={stopAllPlaying} />
                            })
                        }
                    </>
                }

            </div>
        </PixelDivWBorder>
    </div>
}

function CustomFlavorShopItem({ flavor, playCustomFlavor, downloadCustomFlavor, addStopCallback, stopAllPlaying }: { flavor: CustomFlavor; playCustomFlavor: () => Promise<void>; downloadCustomFlavor: () => void; addStopCallback: (key: string, callback: () => void) => void; stopAllPlaying: () => void }) {

    const [isPlaying, setPlaying] = useState<boolean>(false);
    const currentPlayingTimeout = useRef<NodeJS.Timeout>(null);
    const customFlavors = useCustomFlavors();
    const uuids = customFlavors.customFlavors.map(e => e.uuid);
    const alreadyInstalled = uuids.includes(flavor.uuid)

    const play = () => {
        if (isPlaying) {
            setPlaying(false);
            stopAllPlaying();
            return;
        }
        playCustomFlavor();
        setPlaying(true);
        currentPlayingTimeout.current = setTimeout(() => {
            setPlaying(false);
        }, 5 * 1000);
    };

    addStopCallback(flavor.uuid, () => {
        setPlaying(false);
        if (currentPlayingTimeout.current) {
            clearTimeout(currentPlayingTimeout.current);
        }
    });

    return <PixelDivWBorder max-pixel-width={20} className="custom-flavor" style={{ "--flavor-color": flavor.colors[0] } as any}>
        <h4 className="name">{flavor.name}</h4>
        <img src={flavor.image} alt={flavor.name} className="image" />
        <button className="play" onClick={play}>
            {
                isPlaying && <img src="./imgs/actionButtons/pause.png" alt="pause" />
            }
            {
                !isPlaying && <img src="./imgs/actionButtons/play.png" alt="play" />
            }
        </button>
        <>
            {
                !alreadyInstalled && <button className="download" onClick={downloadCustomFlavor}>
                    <img src="./imgs/actionButtons/dishList/download.png" alt="download" />
                </button>
            }
            {
                alreadyInstalled && <span className="already-installed">Installed</span>
            }
        </>
    </PixelDivWBorder>;
}