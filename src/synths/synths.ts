import Tone from 'tone'
import { Note, Time, Velocity } from '../../types/timeAndSpace'
import * as NV1Engine from 'viktor-nv1-engine'
import { ViktorTonePoly } from '../synths/ViktorTone'
import update from 'immutability-helper'

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
    value: () => any // TODO it might be better to not pass the function down to UI components, but rather the evaluated value, so react can only rerender when the value actually changed
    values: ParameterValues
}

export type SynthParameterControlType = 'select' | 'knob'

export type ParameterValues = DiscreteParameterValues | ParameterValueRange
export type DiscreteParameterValues = { type: 'DiscreteParameterValues'; values: any[] }
export type ParameterValueRange = { type: 'ParameterValueRange'; valueRange: ValueRange }

export const isDiscreteParameterValues = (parameterValues: ParameterValues): parameterValues is DiscreteParameterValues => {
    return parameterValues.type === 'DiscreteParameterValues'
}

export const isParameterValueRange = (parameterValues: ParameterValues): parameterValues is ParameterValueRange => {
    return parameterValues.type === 'ParameterValueRange'
}

export interface ValueRange {
    min: number
    max: number
}

interface ViktorSynthContainer {
    viktorDawEngine: any
    viktorPatchLibrary: any
    viktorStore: any
}

// TODO make dynamic
type ViktorSynthParameterName = 'patch' | 'instruments.synth.oscillator.osc2.fineDetune'

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
                    values: { type: 'DiscreteParameterValues', values: omniOscillatorTypes() },
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
                    values: { type: 'DiscreteParameterValues', values: viktorPatchLibrary.getDefaultNames() },
                },
                {
                    name: 'instruments.synth.oscillator.osc2.fineDetune',
                    description: 'OSC2 Detune',
                    controlType: 'knob',
                    value: () => viktorDawEngine.instruments[0].oscillatorSettings.osc2.fineDetune.value, // TODO make dynamic
                    values: { type: 'ParameterValueRange', valueRange: { min: -800, max: 800 } }, // TODO read range from RANGE_LIBRARY
                },
            ],
            onChangeParameter: (parameterName, parameterValue) => {
                setViktorParameterValue(viktorSynthContainer, parameterName as ViktorSynthParameterName, parameterValue)
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
    switch (parameterName) {
        case 'patch':
            setViktorPatch(synth, parameterValue)
            break
        case 'instruments.synth.oscillator.osc2.fineDetune':
            const instrument = synth.viktorDawEngine.instruments[0]
            const newOscSettings = update(instrument.oscillatorSettings, { osc2: { fineDetune: { value: { $set: parameterValue } } } })
            // oscillatorSettings is a defined property with a setter, therefore we need to modify it like this, and cannot use update
            instrument.oscillatorSettings = newOscSettings
            break
        default:
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
