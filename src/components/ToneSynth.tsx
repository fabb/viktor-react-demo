import * as React from 'react'
import { ToneSynthContainer } from './ToneSynthContainer'
import { ToneSynthUI } from './ToneSynthUI'
import { Keyboard } from './Keyboard'

export class ToneSynth extends React.Component {
    render() {
        return (
            <ToneSynthContainer>
                {props => (
                    <div>
                        <ToneSynthUI {...props} />
                        <Keyboard {...props} />
                    </div>
                )}
            </ToneSynthContainer>
        )
    }
}
