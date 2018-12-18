import * as React from "react"
import * as NV1Engine from "viktor-nv1-engine"

const midiNoteOn = 144
const midiNoteOff = 128
const velocityOff = 0

class ViktorNV1 extends React.Component {
    render() {
        return <ViktorNV1SynthContainer>{props => <ViktorNV1SynthUI {...props} />}</ViktorNV1SynthContainer>
    }
}

class ViktorNV1SynthContainer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            store: {
                get: function(name) {},
                set: function(name, data) {},
                remove: function(name) {}
            },
            dawEngine: {},
            patchLibrary: {},
            selectedPatchName: ""
        }
    }

    componentDidMount() {
        const AudioContext = global.AudioContext || global.webkitAudioContext
        const { dawEngine, patchLibrary } = NV1Engine.create(AudioContext, this.state.store)

        const patchNames = patchLibrary.getDefaultNames()
        patchLibrary.selectPatch(patchNames[2])
        const patch = patchLibrary.getSelected().patch
        dawEngine.loadPatch(patch)

        this.setState({
            dawEngine: dawEngine,
            patchLibrary: patchLibrary,
            selectedPatchName: patchLibrary.getSelected().name
        })
    }

    componentWillUnmount() {
        this.state.dawEngine.audioContext.close()
    }

    startContextIfNotStarted = () => {
        // audiocontext initially is in suspended state for most browsers, needs to be started on first user interaction
        const audioContext = this.state.dawEngine.audioContext
        if (audioContext.state !== "running") {
            audioContext.resume().then(() => {
                console.log("Playback resumed successfully")
            })
        }
    }

    onPatchChange = ({ newPatchName }) => {
        const patchLibrary = this.state.patchLibrary
        patchLibrary.selectPatch(newPatchName)
        const patch = patchLibrary.getSelected().patch
        this.state.dawEngine.loadPatch(patch)
        this.setState({
            selectedPatchName: patchLibrary.getSelected().name
        })
    }

    noteOn = ({ note, velocity }) => {
        this.state.dawEngine.externalMidiMessage({
            data: [midiNoteOn, note, velocity]
        })
    }

    noteOff = ({ note }) => {
        this.state.dawEngine.externalMidiMessage({
            data: [midiNoteOff, note, velocityOff]
        })
    }

    render() {
        const patchLibrary = this.state.patchLibrary
        const patchNames = patchLibrary && patchLibrary.getDefaultNames && patchLibrary.getDefaultNames()
        const selectedPatchName = patchLibrary && patchLibrary.getSelected && patchLibrary.getSelected().name
        const renderFuncProps = {
            startContextIfNotStarted: this.startContextIfNotStarted,
            noteOn: this.noteOn,
            noteOff: this.noteOff,
            patchNames: patchNames,
            selectedPatchName: selectedPatchName,
            onPatchChange: this.onPatchChange
        }
        return this.props.children(renderFuncProps)
    }
}

const ViktorNV1SynthUI = props => (
    <div>
        <PatchSelect {...props} />
        <Keyboard {...props} />
    </div>
)

const PatchSelect = ({ patchNames, selectedPatchName, onPatchChange }) => {
    return (
        <div>
            <label htmlFor="patch">Patch: </label>
            <select
                id="patch"
                value={selectedPatchName}
                onChange={event => {
                    const newPatchName = event.target.value
                    onPatchChange({ newPatchName })
                }}
            >
                {patchNames
                    ? patchNames.map(patchName => {
                          return (
                              <option key={patchName} value={patchName}>
                                  {patchName}
                              </option>
                          )
                      })
                    : "loading..."}
            </select>
        </div>
    )
}

const Keyboard = ({ startContextIfNotStarted, noteOn, noteOff }) => {
    const note = 64
    return (
        <button
            onMouseDown={() => {
                startContextIfNotStarted()
                noteOn({ note: note, velocity: 100 })
            }}
            onMouseUp={() => {
                noteOff({ note: note })
            }}
        >
            Play Note
        </button>
    )
}

export default ViktorNV1
