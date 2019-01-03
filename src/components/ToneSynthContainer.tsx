import * as React from 'react'
import Tone from 'tone'
import * as NV1Engine from 'viktor-nv1-engine'

const midiNoteOn = 144
const midiNoteOff = 128

export interface ToneSynthContainerRenderFuncProps {
    noteOn: (x: { note: number; velocity: Velocity }) => void
    noteOff: (x: { note: number }) => void
    startSong: () => void
    stopSong: () => void
    synthIds: SynthId[]
    selectedSynthId: SynthId
    onSelectedSynthChange: (x: { newSynthId: SynthId }) => void
    viktorParameters: ViktorParameters
}

/** Velocity is in range 0-1 */
type Velocity = number

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

export type SynthId = 'bass' | 'kick' | 'hh' | 'viktor'

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
            viktorDawEngine: undefined,
            viktorPatchLibrary: undefined,
            viktorStore: {
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
        }
    }

    componentDidMount() {
        const audioContext = Tone.context

        const bassSynth = new Tone.Synth().toMaster()
        const kickSynth = new Tone.MembraneSynth().toMaster()
        const hhSynth = new Tone.MetalSynth().toMaster()

        function fakeAudioContextConstructor() {
            return audioContext
        }
        const { dawEngine, patchLibrary } = NV1Engine.create(fakeAudioContextConstructor, this.state.viktorStore)
        const viktorDawEngine = dawEngine
        const viktorPatchLibrary = patchLibrary

        const patchNames = viktorPatchLibrary.getDefaultNames()
        viktorPatchLibrary.selectPatch(patchNames[2])
        const patch = viktorPatchLibrary.getSelected().patch
        viktorDawEngine.loadPatch(patch)

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
            viktor: {
                synthObject: viktorDawEngine,
                triggerAttack: (note, time, velocity) => {
                    viktorDawEngine.externalMidiMessage({
                        data: [midiNoteOn, note, (velocity || 1) * 127],
                    })
                },
                triggerRelease: (note, time) => {
                    viktorDawEngine.externalMidiMessage({
                        data: [midiNoteOff, note, 0],
                    })
                },
                triggerAttackRelease: (note, duration, time, velocity) => {
                    // TODO this does not yet work, since the time of attack and release need to be scheduled using AudioParams
                    // viktorDawEngine.externalMidiMessage({
                    //     data: [midiNoteOn, note, (velocity || 1) * 127],
                    // })
                    // setTimeout(() => {
                    //     viktorDawEngine.externalMidiMessage({
                    //         data: [midiNoteOff, note, 0],
                    //     })
                    // }, 1000)
                },
            },
        }

        this.setState(
            {
                audioContext: audioContext,
                synths: synths,
                selectedSynthId: 'viktor',
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
        // const viktorSynth = this.state.synths['viktor']!

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

        new Tone.Sequence(
            (time: Time, note: Note) => {
                // TODO this does not yet work, since the time of attack and release need to be scheduled using AudioParams
                // viktorSynth.triggerAttackRelease(note, '8n', time)
            },
            ['F1', null, ['F2'], null],
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
