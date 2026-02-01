import type { FlavorFileMusic } from "../../audio/FlavorMusic"
import FlavorDragNDropListItem from "./FlavorDragNDropListItem";
import "./FlavorDragNDropList.scss";

type Props = {
    flavors: FlavorFileMusic[];
    hasDownloaded: boolean;
}

export default function FlavorDragNDropList({ flavors, hasDownloaded }: Props) {
    return <ul className="flavor-drag-n-drop-list">
        {flavors.map(flavor => <FlavorDragNDropListItem key={flavor.NAME} hasDownloaded={hasDownloaded} player={flavor}></FlavorDragNDropListItem>)}
    </ul>
}