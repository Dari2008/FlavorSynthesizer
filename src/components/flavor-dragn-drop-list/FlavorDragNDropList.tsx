import type { FlavorFileMusic } from "../../audio/FlavorMusic"
import FlavorDragNDropListItem from "./FlavorDragNDropListItem";
import "./FlavorDragNDropList.scss";
import { FLAVORS } from "../../audio/Flavors";

type Props = {
    hasDownloaded: boolean;
}

export default function FlavorDragNDropList({ hasDownloaded }: Props) {
    return <ul className="flavor-drag-n-drop-list">
        {FLAVORS.map(flavor => <FlavorDragNDropListItem key={flavor.NAME} hasDownloaded={hasDownloaded} player={flavor}></FlavorDragNDropListItem>)}
    </ul>
}