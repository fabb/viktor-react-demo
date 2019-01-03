import * as React from 'react'
import * as NV1Engine from 'viktor-nv1-engine'
import { Knob } from 'react-rotary-knob'
import update from 'immutability-helper'
import '@fabb/react-piano/dist/styles.css'
import { Keyboard } from './Keyboard'
import { Select } from './Select'

const midiNoteOn = 144
const midiNoteOff = 128
const velocityOff = 0

export class ViktorNV1 extends React.Component {
    render() {
        return <ViktorNV1SynthContainer>{props => <ViktorNV1SynthUI {...props} />}</ViktorNV1SynthContainer>
    }
}

interface ViktorNV1SynthContainerRenderFuncProps {
    /** velocity is in range 0-1 */
    noteOn: (x: { note: number; velocity: number }) => void
    /** velocity is in range 0-1 */
    noteOff: (x: { note: number }) => void
    patchNames: string[]
    selectedPatchName: string
    onPatchChange: (x: { newPatchName: string }) => void
    onParameterChange: (parameterName: ParameterName, newValue: number) => void
    values: { [K in ParameterName]?: number } // TODO non-optional
    ranges: any // TODO use RANGE_LIBRARY - warning, viktor always translates patches to the newest ENGINE_VERSION
}

type ParameterName = 'instruments.synth.oscillator.osc2.fineDetune' // [-800, 800]

const parameterUIName = (parameterName: ParameterName) => {
    switch (parameterName) {
        case 'instruments.synth.oscillator.osc2.fineDetune':
            return 'OSC2 Detune'
    }
}

interface ViktorNV1SynthContainerProps {
    children: (renderProps: ViktorNV1SynthContainerRenderFuncProps) => React.ReactNode
}

interface ViktorNV1SynthContainerState {
    store: {
        get: (name: string) => void
        set: (name: string, data: any) => void
        remove: (name: string) => void
    }
    dawEngine: any
    patchLibrary: any
}

class ViktorNV1SynthContainer extends React.Component<ViktorNV1SynthContainerProps, ViktorNV1SynthContainerState> {
    constructor(props: ViktorNV1SynthContainerProps) {
        super(props)
        this.state = {
            store: {
                get: name => {
                    // nothing
                },
                set: (name, data) => {
                    // nothing
                },
                remove: name => {
                    // nothing
                },
            },
            dawEngine: {},
            patchLibrary: {},
        }
    }

    componentDidMount() {
        const AudioContext = (global as any).AudioContext || (global as any).webkitAudioContext
        const { dawEngine, patchLibrary } = NV1Engine.create(AudioContext, this.state.store)

        const patchNames = patchLibrary.getDefaultNames()
        patchLibrary.selectPatch(patchNames[2])
        const patch = patchLibrary.getSelected().patch
        dawEngine.loadPatch(patch)

        this.setState({
            dawEngine: dawEngine,
            patchLibrary: patchLibrary,
        })
    }

    componentWillUnmount() {
        this.state.dawEngine.audioContext.close()
    }

    startContextIfNotStarted = () => {
        // audiocontext initially is in suspended state for most browsers, needs to be started on first user interaction
        const audioContext = this.state.dawEngine.audioContext
        if (audioContext.state !== 'running') {
            audioContext.resume().then(() => {
                console.log('Playback resumed successfully')
            })
        }
    }

    onPatchChange = ({ newPatchName }: { newPatchName: string }) => {
        this.setState(oldState => {
            const dawEngine = oldState.dawEngine
            const patchLibrary = oldState.patchLibrary
            patchLibrary.selectPatch(newPatchName)
            const patch = patchLibrary.getSelected().patch
            dawEngine.loadPatch(patch)
            return {
                dawEngine: dawEngine,
                patchLibrary: patchLibrary,
            }
        })
    }

    noteOn = ({ note, velocity }: { note: number; velocity: number }) => {
        this.startContextIfNotStarted()
        this.state.dawEngine.externalMidiMessage({
            data: [midiNoteOn, note, velocity * 127],
        })
    }

    noteOff = ({ note }: { note: number }) => {
        this.state.dawEngine.externalMidiMessage({
            data: [midiNoteOff, note, velocityOff],
        })
    }

    onParameterChange = (parameterName: ParameterName, newValue: number) => {
        switch (parameterName) {
            case 'instruments.synth.oscillator.osc2.fineDetune':
                if (newValue === this.state.dawEngine.instruments[0].oscillatorSettings.osc2.fineDetune.value) {
                    return
                }

                this.setState(oldState => {
                    const instrument = oldState.dawEngine.instruments[0]
                    const newOscSettings = update(instrument.oscillatorSettings, { osc2: { fineDetune: { value: { $set: newValue } } } })
                    // oscillatorSettings is a defined property with a setter, therefore we need to modify it like this, and cannot use update
                    instrument.oscillatorSettings = newOscSettings
                    return { dawEngine: oldState.dawEngine }
                })
        }
    }

    currentParameterValuesAndRanges = (): { values: { [K in ParameterName]?: number }; ranges: any } => {
        if (!this.state.dawEngine || !this.state.dawEngine.instruments || !this.state.dawEngine.instruments[0]) {
            return {
                values: {},
                ranges: {},
            }
        }

        const instrument = this.state.dawEngine.instruments[0]

        return {
            values: {
                'instruments.synth.oscillator.osc2.fineDetune': instrument.oscillatorSettings.osc2.fineDetune.value,
            },
            ranges: {
                'instruments.synth.oscillator.osc2.fineDetune': instrument.oscillatorSettings.osc2.fineDetune.range,
            },
        }
    }

    render() {
        const patchLibrary = this.state.patchLibrary
        const patchNames = patchLibrary && patchLibrary.getDefaultNames && patchLibrary.getDefaultNames()
        const selectedPatchName = patchLibrary && patchLibrary.getSelected && patchLibrary.getSelected().name
        const valuesAndRanges = this.currentParameterValuesAndRanges()
        const renderFuncProps: ViktorNV1SynthContainerRenderFuncProps = {
            noteOn: this.noteOn,
            noteOff: this.noteOff,
            patchNames: patchNames,
            selectedPatchName: selectedPatchName,
            onPatchChange: this.onPatchChange,
            onParameterChange: this.onParameterChange,
            values: valuesAndRanges['values'],
            ranges: valuesAndRanges['ranges'],
        }
        return this.props.children(renderFuncProps)
    }
}

const ViktorNV1SynthUI = (props: ViktorNV1SynthContainerRenderFuncProps) => (
    <div>
        <Select
            id="patch"
            label="Patch"
            selectValues={props.patchNames}
            selectedValue={props.selectedPatchName}
            onSelectedValueChange={({ newSelectedValue }) => props.onPatchChange({ newPatchName: newSelectedValue })}
        />
        <ParameterControlContainer {...props} />
        <Keyboard {...props} />
    </div>
)

const ParameterControlContainer = ({ onParameterChange, values }: Pick<ViktorNV1SynthContainerRenderFuncProps, 'onParameterChange' | 'values'>) => {
    return (
        <div>
            <ParameterControl
                onParameterChange={onParameterChange}
                parameter={'instruments.synth.oscillator.osc2.fineDetune'}
                value={values['instruments.synth.oscillator.osc2.fineDetune'] || 0}
            />
        </div>
    )
}

interface ParameterControlProps {
    onParameterChange: (parameterName: ParameterName, newValue: number) => void
    parameter: ParameterName
    value: number
}

const ParameterControl = ({ onParameterChange, parameter, value }: ParameterControlProps) => {
    return (
        <div style={{ display: 'inline-block' }}>
            {/* TODO range */}
            <Knob onChange={(newValue: number) => onParameterChange(parameter, newValue)} value={value} min={-800} max={800} />
            <p>{parameterUIName(parameter)}</p>
            <p style={{ maxWidth: '20px' }}>{value}</p>
        </div>
    )
}
