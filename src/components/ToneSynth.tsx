import * as React from 'react'
import { ToneSynthContainer } from './ToneSynthContainer'
import { ToneSynthUI } from './ToneSynthUI'
import '../App.css'

export class ToneSynth extends React.Component {
    render() {
        return <ToneSynthContainer>{props => <ToneSynthUI {...props} />}</ToneSynthContainer>
    }
}
