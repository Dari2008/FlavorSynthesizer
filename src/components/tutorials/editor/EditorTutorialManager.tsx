import SelectMainFlavorTutorial from "./selectMainFlavor/SelectMainFlavorTutorial";
import ShareTutorial from "./share/ShareTutorial";
import IntitialLandingEditorTutorial from "./initialLandingEditor/IntitialLandingEditorTutorial";
import SynthLineTutorial from "./synthLine/SynthLineTutorial";

export default function EditorTutorialManager({ currentSelected }: { currentSelected: EditorTutorialManagerSelection }) {
    return <>
        {
            currentSelected == "editor-opened" && <IntitialLandingEditorTutorial />
        }
        {
            currentSelected == "editor-share" && <ShareTutorial />
        }
        {
            currentSelected == "editor-selectedMainFlavor" && <SelectMainFlavorTutorial />
        }
        {
            currentSelected == "editor-addedSynthLine" && <SynthLineTutorial />
        }
    </>
}

export type EditorTutorialManagerSelection = "editor-selectedMainFlavor" | "editor-addedSynthLine" | "editor-share" | "editor-placed-first-flavor" | "editor-opened";