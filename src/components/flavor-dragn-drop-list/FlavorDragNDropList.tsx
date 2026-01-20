import type { FlavorFileMusic } from "../../audio/FlavorMusic"
import FlavorDragNDropListItem from "./FlavorDragNDropListItem";
import "./FlavorDragNDropList.scss";

type Props = {
    flavors: FlavorFileMusic[];
}

export default function FlavorDragNDropList({ flavors }: Props) {
    return <ul className="flavor-drag-n-drop-list">
        {flavors.map(flavor => <FlavorDragNDropListItem key={flavor.NAME} player={flavor}></FlavorDragNDropListItem>)}
    </ul>
}