import { FLAVORS } from "../audio/Flavors";
import FlavorDragNDropList from "../components/flavor-dragn-drop-list/FlavorDragNDropList";
import FlavorSynth from "../components/flavorSynth/FlavorSynth";
import "./App.scss";

export default function App() {

    return <>
        <FlavorSynth></FlavorSynth>

        <FlavorDragNDropList flavors={FLAVORS}></FlavorDragNDropList>

    </>
}