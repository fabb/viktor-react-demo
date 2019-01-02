import * as React from 'react'
import Tone from 'tone'

export interface ToneSynthContainerRenderFuncProps {
    noteOn: (x: { note: number; velocity: Velocity }) => void
    noteOff: (x: { note: number }) => void
    startSong: () => void
    stopSong: () => void
}

/** Velocity is in range 0-1 */
type Velocity = number

interface ToneSynthContainerProps {
    children: (renderProps: ToneSynthContainerRenderFuncProps) => React.ReactNode
}

interface ToneSynthContainerState {
    audioContext?: any
    synths: { [K in SynthId]?: Synth }
    selectedSynthId: SynthId
    playState: PlayState
}

type SynthId = 'bass'
interface Synth {
    synthObject: any
    triggerAttack: (note: Note, time?: Time, velocity?: Velocity) => void
    triggerRelease: (note: Note, time?: Time) => void
    triggerAttackRelease: (note: Note, duration: Time, time?: Time, velocity?: Velocity) => void
}

type Note = string | number
type Time = string // Tone.Time

type PlayState = 'stopped' | 'running'

export class ToneSynthContainer extends React.Component<ToneSynthContainerProps, ToneSynthContainerState> {
    constructor(props: ToneSynthContainerProps) {
        super(props)
        this.state = {
            audioContext: null,
            synths: {},
            selectedSynthId: 'bass',
            playState: 'stopped',
        }
    }

    componentDidMount() {
        const AudioContext = (global as any).AudioContext || (global as any).webkitAudioContext
        const audioContext = new AudioContext()
        const bassSynth = new Tone.Synth().toMaster()
        const synths: { [K in SynthId]?: Synth } = {
            bass: {
                synthObject: bassSynth,
                triggerAttack: (note, time, velocity) => {
                    bassSynth.triggerAttack(note, time, velocity)
                },
                triggerRelease: (note, time) => {
                    bassSynth.triggerRelease()
                },
                triggerAttackRelease: (note, duration, time, velocity) => {
                    bassSynth.triggerAttackRelease(note, duration, time, velocity)
                },
            },
        }

        this.setState(
            {
                audioContext: audioContext,
                synths: synths,
                selectedSynthId: 'bass',
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

    noteOn = ({ note, velocity }: { note: number; velocity: number }) => {
        this.startContextIfNotStarted()
        this.selectedSynth().triggerAttack(note, '+0.01', velocity)
    }

    noteOff = ({ note }: { note: number }) => {
        this.selectedSynth().triggerRelease(note)
    }

    selectedSynth = (): Synth => {
        return this.state.synths[this.state.selectedSynthId]!
    }

    startSong = () => {
        Tone.Transport.stop()

        this.selectSong()

        Tone.Transport.bpm.value = 140
        Tone.Transport.start('+0.1')

        this.setState({ playState: 'running' })
    }

    selectSong = () => {
        Tone.Transport.cancel()

        const bassSynth = this.state.synths['bass']!

        new Tone.Sequence(
            (time: any, pitch: any) => {
                bassSynth.triggerAttackRelease(pitch, '8n', time)
            },
            ['F1', 'F2', ['F1', 'F2'], [null, 'F2']],
            '4n'
        )
            .start('0m')
            .set({
                loop: true,
                loopEnd: '1m',
            })
    }

    stopSong = () => {
        Tone.Transport.stop()

        this.setState({ playState: 'stopped' })
    }

    render() {
        const renderFuncProps: ToneSynthContainerRenderFuncProps = {
            noteOn: this.noteOn,
            noteOff: this.noteOff,
            startSong: this.startSong,
            stopSong: this.stopSong,
        }
        return this.props.children(renderFuncProps)
    }
}
