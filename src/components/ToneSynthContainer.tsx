import * as React from 'react'
import Tone from 'tone'
import { Velocity, MidiNote } from '../../types/timeAndSpace'
import { SynthId, Synth, createSynths } from '../synths/synths'
import { loadSong1 } from '../songs/songs'

export interface ToneSynthContainerRenderFuncProps {
    noteOn: (x: { midiNote: MidiNote; velocity: Velocity }) => void
    noteOff: (x: { midiNote: MidiNote }) => void
    startSong: () => void
    stopSong: () => void
    synthIds: SynthId[]
    selectedSynthId: SynthId
    onSelectedSynthChange: (x: { newSynthId: SynthId }) => void
    viktorParameters: ViktorParameters
}

interface ViktorParameters {
    patchNames: string[]
    selectedPatchName: string
    onPatchChange: (x: { newPatchName: string }) => void
}

interface ToneSynthContainerProps {
    children: (renderProps: ToneSynthContainerRenderFuncProps) => React.ReactNode
}

interface ToneSynthContainerState {
    audioContext?: any
    synths: { [K in SynthId]?: Synth }
    selectedSynthId: SynthId
    playState: PlayState
    viktorDawEngine: any
    viktorPatchLibrary: any
    viktorStore: {
        get: (name: string) => void
        set: (name: string, data: any) => void
        remove: (name: string) => void
    }
}

type PlayState = 'stopped' | 'running'

export class ToneSynthContainer extends React.Component<ToneSynthContainerProps, ToneSynthContainerState> {
    constructor(props: ToneSynthContainerProps) {
        super(props)
        this.state = {
            audioContext: null,
            synths: {},
            selectedSynthId: 'Tone Synth',
            playState: 'stopped',
            viktorDawEngine: undefined,
            viktorPatchLibrary: undefined,
            viktorStore: {
                get: () => {
                    // nothing
                },
                set: () => {
                    // nothing
                },
                remove: () => {
                    // nothing
                },
            },
        }
    }

    componentDidMount() {
        const audioContext = Tone.context
        const { synths, viktorDawEngine, viktorPatchLibrary } = createSynths(audioContext, this.state.viktorStore)

        this.setState(
            {
                audioContext: audioContext,
                synths: synths,
                selectedSynthId: 'ViktorTone Synth',
                viktorDawEngine: viktorDawEngine,
                viktorPatchLibrary: viktorPatchLibrary,
            },
            () => {
                if (this.state.playState === 'running') {
                    this.startSong()
                }
            }
        )
    }

    componentWillUnmount() {
        // for HMR - remove all previous elements
        Tone.Transport.cancel()
        Tone.Transport.stop()
        Tone.Transport.position = '0m'

        this.state.audioContext.close()
    }

    startContextIfNotStarted = () => {
        // audiocontext initially is in suspended state for most browsers, needs to be started on first user interaction
        const audioContext = this.state.audioContext
        if (audioContext.state !== 'running') {
            audioContext.resume().then(() => {
                console.log('Playback resumed successfully')
            })
        }
    }

    noteOn = ({ midiNote, velocity }: { midiNote: MidiNote; velocity: Velocity }) => {
        this.startContextIfNotStarted()
        const note = Tone.Frequency(midiNote, 'midi')
        this.selectedSynth().triggerAttack(note, '+0.01', velocity)
    }

    noteOff = ({ midiNote }: { midiNote: MidiNote }) => {
        const note = Tone.Frequency(midiNote, 'midi')
        this.selectedSynth().triggerRelease(note)
    }

    selectedSynth = (): Synth => {
        return this.state.synths[this.state.selectedSynthId]!
    }

    startSong = () => {
        this.startContextIfNotStarted()
        Tone.Transport.stop()
        loadSong1(this.state.synths)
        Tone.Transport.start('+0.1')
        this.setState({ playState: 'running' })
    }

    stopSong = () => {
        Tone.Transport.stop()
        this.setState({ playState: 'stopped' })
    }

    onSelectedSynthChange = ({ newSynthId }: { newSynthId: SynthId }) => {
        this.setState({ selectedSynthId: newSynthId })
    }

    onViktorPatchChange = ({ newPatchName }: { newPatchName: string }) => {
        this.setState(oldState => {
            const dawEngine = oldState.viktorDawEngine
            const patchLibrary = oldState.viktorPatchLibrary
            patchLibrary.selectPatch(newPatchName)
            const patch = patchLibrary.getSelected().patch
            dawEngine.loadPatch(patch)
            return {
                viktorDawEngine: dawEngine,
                viktorPatchLibrary: patchLibrary,
            }
        })
    }

    render() {
        const viktorPatchLibrary = this.state.viktorPatchLibrary
        const viktorPatchNames = viktorPatchLibrary && viktorPatchLibrary.getDefaultNames && viktorPatchLibrary.getDefaultNames()
        const viktorSelectedPatchName = viktorPatchLibrary && viktorPatchLibrary.getSelected && viktorPatchLibrary.getSelected().name

        const renderFuncProps: ToneSynthContainerRenderFuncProps = {
            noteOn: this.noteOn,
            noteOff: this.noteOff,
            startSong: this.startSong,
            stopSong: this.stopSong,
            synthIds: Object.keys(this.state.synths) as SynthId[],
            selectedSynthId: this.state.selectedSynthId,
            onSelectedSynthChange: this.onSelectedSynthChange,
            viktorParameters: {
                patchNames: viktorPatchNames,
                selectedPatchName: viktorSelectedPatchName,
                onPatchChange: this.onViktorPatchChange,
            },
        }
        return this.props.children(renderFuncProps)
    }
}
