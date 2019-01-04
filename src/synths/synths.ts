import Tone from 'tone'
import { Note, Time, Velocity } from '../../types/timeAndSpace'
import * as NV1Engine from 'viktor-nv1-engine'
import { ViktorTone } from '../synths/ViktorTone'

const midiNoteOn = 144
const midiNoteOff = 128

export type SynthId = 'Tone Synth' | 'Tone MembraneSynth' | 'Tone MetalSynth' | 'Viktor' | 'ViktorTone Synth'

export interface Synth {
    synthObject: any
    triggerAttack: (note: Note, time?: Time, velocity?: Velocity) => void
    triggerRelease: (note: Note, time?: Time) => void
    triggerAttackRelease: (note: Note, duration: Time, time?: Time, velocity?: Velocity) => void
}

export const createSynths = (audioContext: any, viktorStore: any) => {
    const bassSynth = new Tone.Synth().toMaster()
    const kickSynth = new Tone.MembraneSynth().toMaster()
    const hhSynth = new Tone.MetalSynth().toMaster()
    const viktorToneSynth = new ViktorTone().toMaster()

    function fakeAudioContextConstructor() {
        return audioContext
    }
    const { dawEngine, patchLibrary } = NV1Engine.create(fakeAudioContextConstructor, viktorStore)
    const viktorDawEngine = dawEngine
    const viktorPatchLibrary = patchLibrary

    const patchNames = viktorPatchLibrary.getDefaultNames()
    viktorPatchLibrary.selectPatch(patchNames[2])
    const patch = viktorPatchLibrary.getSelected().patch
    viktorDawEngine.loadPatch(patch)

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
        },
        Viktor: {
            synthObject: viktorDawEngine,
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
        },
        'ViktorTone Synth': {
            synthObject: viktorToneSynth,
            triggerAttack: (note, time, velocity) => {
                viktorToneSynth.triggerAttack(note, time, velocity)
            },
            triggerRelease: (note, time) => {
                viktorToneSynth.triggerRelease(time)
            },
            triggerAttackRelease: (note, duration, time, velocity) => {
                viktorToneSynth.triggerAttackRelease(note, duration, time, velocity)
            },
        },
    }

    return { synths, viktorDawEngine, viktorPatchLibrary }
}
