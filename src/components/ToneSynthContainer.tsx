import * as React from 'react'
import Tone from 'tone'
import { Velocity, MidiNote } from '../../types/timeAndSpace'
import { SynthId, Synth, createSynths, SynthParameter } from '../synths/synths'
import { loadSong1 } from '../songs/songs'

export interface ToneSynthContainerRenderFuncProps {
    noteOn: (x: { midiNote: MidiNote; velocity: Velocity }) => void
    noteOff: (x: { midiNote: MidiNote }) => void
    startSong: () => void
    stopSong: () => void
    synthIds: SynthId[]
    selectedSynthId: SynthId
    onSelectedSynthChange: (x: { newSynthId: SynthId }) => void
    synthParameters: { [K in SynthId]?: SynthParameter[] }
    onChangeParameter: (synthId: SynthId, parameterName: string, parameterValue: any) => void
}

interface ToneSynthContainerProps {
    children: (renderProps: ToneSynthContainerRenderFuncProps) => React.ReactNode
}

interface ToneSynthContainerState {
    audioContext?: any
    synths: { [K in SynthId]?: Synth }
    selectedSynthId: SynthId
    playState: PlayState
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
        }
    }

    componentDidMount() {
        const audioContext = Tone.context
        const synths = createSynths(audioContext)

        this.setState(
            {
                audioContext: audioContext,
                synths: synths,
                selectedSynthId: 'Tone Synth',
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

    onChangeParameter = (synthId: SynthId, parameterName: string, parameterValue: any) => {
        const synth = this.state.synths[synthId]
        if (!synth) {
            return
        }

        synth.onChangeParameter(parameterName, parameterValue)

        // this currently works to update the state, but might break in the future due to some internal react update
        this.setState(oldState => {
            return {
                synths: oldState.synths,
            }
        })
    }

    render() {
        const synthParameters: { [K in SynthId]?: SynthParameter[] } = Object.assign({}, ...Object.keys(this.state.synths).map(k => ({ [k]: this.state.synths[k].parameters })))

        const renderFuncProps: ToneSynthContainerRenderFuncProps = {
            noteOn: this.noteOn,
            noteOff: this.noteOff,
            startSong: this.startSong,
            stopSong: this.stopSong,
            synthIds: Object.keys(this.state.synths) as SynthId[],
            selectedSynthId: this.state.selectedSynthId,
            onSelectedSynthChange: this.onSelectedSynthChange,
            synthParameters: synthParameters,
            onChangeParameter: this.onChangeParameter,
        }
        return this.props.children(renderFuncProps)
    }
}
