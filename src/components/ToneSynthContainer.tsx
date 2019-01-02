import * as React from 'react'
import Tone from 'tone'

export interface ToneSynthContainerRenderFuncProps {
    noteOn: (x: { note: number; velocity: Velocity }) => void
    noteOff: (x: { note: number }) => void
    startSong: () => void
    stopSong: () => void
    synthIds: SynthId[]
    selectedSynthId: SynthId
    onSelectedSynthChange: (x: { newSynthId: SynthId }) => void
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

export type SynthId = 'bass' | 'kick' | 'hh'

interface Synth {
    synthObject: any
    triggerAttack: (note: Note, time?: Time, velocity?: Velocity) => void
    triggerRelease: (note: Note, time?: Time) => void
    triggerAttackRelease: (note: Note, duration: Time, time?: Time, velocity?: Velocity) => void
}

type Note = string | number | undefined
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
        const audioContext = Tone.context
        const bassSynth = new Tone.Synth().toMaster()
        const kickSynth = new Tone.MembraneSynth().toMaster()
        const hhSynth = new Tone.MetalSynth().toMaster()
        const synths: { [K in SynthId]?: Synth } = {
            bass: {
                synthObject: bassSynth,
                triggerAttack: (note, time, velocity) => {
                    bassSynth.triggerAttack(note, time, velocity)
                },
                triggerRelease: (note, time) => {
                    bassSynth.triggerRelease(time)
                },
                triggerAttackRelease: (note, duration, time, velocity) => {
                    bassSynth.triggerAttackRelease(note, duration, time, velocity)
                },
            },
            kick: {
                synthObject: kickSynth,
                triggerAttack: (note, time, velocity) => {
                    kickSynth.triggerAttack(note, time, velocity)
                },
                triggerRelease: (note, time) => {
                    kickSynth.triggerRelease(time)
                },
                triggerAttackRelease: (note, duration, time, velocity) => {
                    kickSynth.triggerAttackRelease(note, duration, time, velocity)
                },
            },
            hh: {
                synthObject: hhSynth,
                triggerAttack: (note, time, velocity) => {
                    hhSynth.triggerAttack(time, velocity)
                },
                triggerRelease: (note, time) => {
                    hhSynth.triggerRelease(time)
                },
                triggerAttackRelease: (note, duration, time, velocity) => {
                    hhSynth.triggerAttackRelease(duration, time, velocity)
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

        this.startContextIfNotStarted()

        Tone.Transport.bpm.value = 140
        Tone.Transport.start('+0.1')

        this.setState({ playState: 'running' })
    }

    selectSong = () => {
        Tone.Transport.cancel()

        const bassSynth = this.state.synths['bass']!
        const kickSynth = this.state.synths['kick']!
        const hhSynth = this.state.synths['hh']!

        new Tone.Sequence(
            (time: Time, note: Note) => {
                bassSynth.triggerAttackRelease(note, '8n', time)
            },
            ['F1', 'F2', ['F1', 'F2'], [null, 'F2']],
            '4n'
        )
            .start('0m')
            .set({
                loop: true,
                loopEnd: '1m',
            })

        new Tone.Sequence(
            (time: Time, note: string) => {
                const v = note === 'X' ? 0.05 : 0.02
                kickSynth.triggerAttackRelease('C4', '8n', time, v)
            },
            ['X'],
            '4n'
        )
            .start('0m')
            .set({
                loop: true,
                loopEnd: '4n',
            })

        new Tone.Sequence(
            (time: Time, note: string) => {
                const v = note === 'X' ? 0.015 : 0.008
                hhSynth.triggerAttackRelease(undefined, '8n', time, v)
            },
            ['X', 'x'],
            '8n'
        )
            .start('0m')
            .set({
                loop: true,
                loopEnd: '4n',
            })
    }

    stopSong = () => {
        Tone.Transport.stop()

        this.setState({ playState: 'stopped' })
    }

    onSelectedSynthChange = ({ newSynthId }: { newSynthId: SynthId }) => {
        this.setState({ selectedSynthId: newSynthId })
    }

    render() {
        const renderFuncProps: ToneSynthContainerRenderFuncProps = {
            noteOn: this.noteOn,
            noteOff: this.noteOff,
            startSong: this.startSong,
            stopSong: this.stopSong,
            synthIds: Object.keys(this.state.synths) as SynthId[],
            selectedSynthId: this.state.selectedSynthId,
            onSelectedSynthChange: this.onSelectedSynthChange,
        }
        return this.props.children(renderFuncProps)
    }
}
