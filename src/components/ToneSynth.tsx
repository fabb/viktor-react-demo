import * as React from 'react'
import { ToneSynthContainer } from './ToneSynthContainer'
import { ToneSynthUI } from './ToneSynthUI'
import { Keyboard } from './Keyboard'
import { SynthSelect } from './SynthSelect'

export class ToneSynth extends React.Component {
    render() {
        return (
            <ToneSynthContainer>
                {props => (
                    <div>
                        <SynthSelect {...props} />
                        <ToneSynthUI {...props} />
                        <Keyboard {...props} />
                    </div>
                )}
            </ToneSynthContainer>
        )
    }
}
