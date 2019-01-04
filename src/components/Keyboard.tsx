import * as React from 'react'
import { Piano, KeyboardShortcuts, MidiNumbers } from '@fabb/react-piano'
import '@fabb/react-piano/dist/styles.css'
import { MidiNote } from '../../types/timeAndSpace'

interface KeyboardProps {
    noteOn: (x: { midiNote: MidiNote; velocity: number }) => void
    noteOff: (x: { midiNote: MidiNote }) => void
}

export const Keyboard = ({ noteOn, noteOff }: KeyboardProps) => {
    const firstNote = MidiNumbers.fromNote('c3')
    const lastNote = MidiNumbers.fromNote('f5')
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    })

    return (
        <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNote: MidiNote) => {
                noteOn({ midiNote: midiNote, velocity: 1 })
            }}
            stopNote={(midiNote: MidiNote) => {
                noteOff({ midiNote: midiNote })
            }}
            keyboardShortcuts={keyboardShortcuts}
        />
    )
}
