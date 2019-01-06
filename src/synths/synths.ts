import Tone from 'tone'
import { Note, Time, Velocity } from '../../types/timeAndSpace'
import * as NV1Engine from 'viktor-nv1-engine'
import { ViktorTonePoly } from '../synths/ViktorTone'

const midiNoteOn = 144
const midiNoteOff = 128

export type SynthId = 'Tone Synth' | 'Tone MembraneSynth' | 'Tone MetalSynth' | 'Viktor' | 'ViktorTone Synth'

export interface Synth {
    synthObject: any
    triggerAttack: (note: Note, time?: Time, velocity?: Velocity) => void
    triggerRelease: (note: Note, time?: Time) => void
    triggerAttackRelease: (note: Note, duration: Time, time?: Time, velocity?: Velocity) => void
    parameters: SynthParameter[]
    onChangeParameter: (parameterName: string, parameterValue: any) => void
}

export interface SynthParameter {
    name: string
    description: string
    controlType: SynthParameterControlType
    value: () => any
    values: any[]
    // TODO ranges for knobs
}

export type SynthParameterControlType = 'select'

interface ViktorSynthContainer {
    viktorDawEngine: any
    viktorPatchLibrary: any
    viktorStore: any
}

type ViktorSynthParameterName = 'patch' | string

export const createSynths = (audioContext: any) => {
    const bassSynth = new Tone.Synth().toMaster()
    const kickSynth = new Tone.MembraneSynth().toMaster()
    const hhSynth = new Tone.MetalSynth().toMaster()
    const viktorToneSynth = new ViktorTonePoly().toMaster()

    function fakeAudioContextConstructor() {
        return audioContext
    }
    const viktorStore = {
        get: () => {
            // nothing
        },
        set: () => {
            // nothing
        },
        remove: () => {
            // nothing
        },
    }
    const { dawEngine, patchLibrary } = NV1Engine.create(fakeAudioContextConstructor, viktorStore)
    const viktorDawEngine = dawEngine
    const viktorPatchLibrary = patchLibrary

    const patchNames = viktorPatchLibrary.getDefaultNames()
    viktorPatchLibrary.selectPatch(patchNames[2])
    const patch = viktorPatchLibrary.getSelected().patch
    viktorDawEngine.loadPatch(patch)

    const viktorSynthContainer: ViktorSynthContainer = { viktorDawEngine, viktorPatchLibrary, viktorStore }

    const synths: { [K in SynthId]?: Synth } = {
        'Tone Synth': {
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
            parameters: [
                {
                    name: 'oscillator.type',
                    description: 'Oscillator Type',
                    controlType: 'select',
                    value: () => bassSynth.oscillator.type,
                    values: omniOscillatorTypes(),
                },
            ],
            onChangeParameter: (parameterName, parameterValue) => setSynthParameterValue(bassSynth, parameterName, parameterValue),
        },
        'Tone MembraneSynth': {
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
            parameters: [],
            onChangeParameter: (parameterName, parameterValue) => {},
        },
        'Tone MetalSynth': {
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
            parameters: [],
            onChangeParameter: (parameterName, parameterValue) => {},
        },
        Viktor: {
            synthObject: viktorSynthContainer,
            triggerAttack: (note, time, velocity) => {
                // TODO use time value, since the time of attack needs to be scheduled using AudioParams

                const midiNote = Tone.Frequency(note).toMidi()

                viktorDawEngine.externalMidiMessage({
                    data: [midiNoteOn, midiNote, (velocity || 1) * 127],
                })
            },
            triggerRelease: (note, time) => {
                // TODO use time value, since the time of release needs to be scheduled using AudioParams

                const midiNote = Tone.Frequency(note).toMidi()

                viktorDawEngine.externalMidiMessage({
                    data: [midiNoteOff, midiNote, 0],
                })
            },
            triggerAttackRelease: (note, duration, time, velocity) => {
                // TODO use time and duration values, since the time of attack and release need to be scheduled using AudioParams

                const midiNote = Tone.Frequency(note).toMidi()
                const durationInSeconds = Tone.Time(duration).toSeconds()

                viktorDawEngine.externalMidiMessage({
                    data: [midiNoteOn, midiNote, (velocity || 1) * 127],
                })
                setTimeout(() => {
                    viktorDawEngine.externalMidiMessage({
                        data: [midiNoteOff, midiNote, 0],
                    })
                }, durationInSeconds * 1000)
            },
            parameters: [
                {
                    name: 'patch',
                    description: 'Patch',
                    controlType: 'select',
                    value: () => viktorPatchLibrary.getSelected().name,
                    values: viktorPatchLibrary.getDefaultNames(),
                },
            ],
            onChangeParameter: (parameterName, parameterValue) => {
                setViktorParameterValue(viktorSynthContainer, parameterName, parameterValue)
            },
        },
        'ViktorTone Synth': {
            synthObject: viktorToneSynth,
            triggerAttack: (note, time, velocity) => {
                viktorToneSynth.triggerAttack(note, time, velocity)
            },
            triggerRelease: (note, time) => {
                viktorToneSynth.triggerRelease(note, time)
            },
            triggerAttackRelease: (note, duration, time, velocity) => {
                viktorToneSynth.triggerAttackRelease(note, duration, time, velocity)
            },
            parameters: [],
            onChangeParameter: (parameterName, parameterValue) => {},
        },
    }

    return synths
}

const setSynthParameterValue = (synth: any, parameterName: string, parameterValue: any) => {
    const parameterParts = parameterName.split('.')
    const allButLastParameterParts = parameterParts.slice(0, parameterParts.length - 1)
    const lastParameterPart = parameterParts[parameterParts.length - 1]
    const previousToLastObject = allButLastParameterParts.reduce((previous, current) => {
        return previous[current]
    }, synth)
    previousToLastObject[lastParameterPart] = parameterValue
}

const setViktorParameterValue = (synth: ViktorSynthContainer, parameterName: ViktorSynthParameterName, parameterValue: any) => {
    if (parameterName === 'patch') {
        setViktorPatch(synth, parameterValue)
    } else {
        console.log(`unhandled viktor parameter ${parameterName}`)
    }
}

const setViktorPatch = (synth: ViktorSynthContainer, newPatchName: string) => {
    const dawEngine = synth.viktorDawEngine
    const patchLibrary = synth.viktorPatchLibrary
    patchLibrary.selectPatch(newPatchName)
    const patch = patchLibrary.getSelected().patch
    dawEngine.loadPatch(patch)
}

const omniOscillatorTypes = (): string[] => {
    const basicTypes = ['sine', 'square', 'triangle', 'sawtooth']
    const prefixesForBasics = ['', 'fm', 'am', 'fat']
    const prefixedBasicTypes = prefixesForBasics.flatMap(prefix => basicTypes.map(basicType => prefix + basicType))
    const advancedTypes = ['pwm', 'pulse']
    return prefixedBasicTypes.concat(advancedTypes)
}
