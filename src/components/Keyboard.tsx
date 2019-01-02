import * as React from 'react'
import { Piano, KeyboardShortcuts, MidiNumbers } from '@fabb/react-piano'
import '@fabb/react-piano/dist/styles.css'

interface KeyboardProps {
    noteOn: (x: { note: number; velocity: number }) => void
    noteOff: (x: { note: number }) => void
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
            playNote={(midiNumber: number) => {
                noteOn({ note: midiNumber, velocity: 100 })
            }}
            stopNote={(midiNumber: number) => {
                noteOff({ note: midiNumber })
            }}
            keyboardShortcuts={keyboardShortcuts}
        />
    )
}
