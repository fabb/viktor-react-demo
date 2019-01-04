import Tone from 'tone'
import { SynthId, Synth } from '../synths/synths'
import { Time, Note } from '../../types/timeAndSpace'

export const loadSong1 = (synths: { [K in SynthId]?: Synth }) => {
    Tone.Transport.cancel()
    Tone.Transport.bpm.value = 140

    const bassSynth = synths['Tone Synth']!
    const kickSynth = synths['Tone MembraneSynth']!
    const hhSynth = synths['Tone MetalSynth']!
    const viktorSynth = synths['Viktor']!

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
            viktorSynth.triggerAttackRelease(note, '8n', time, 0.3)
        },
        ['F2', null, ['F3'], null],
        '4n'
    )
        .start('0m')
        .set({
            loop: true,
            loopEnd: '1m',
        })
}
