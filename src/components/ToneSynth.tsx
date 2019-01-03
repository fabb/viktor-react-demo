import * as React from 'react'
import { ToneSynthContainer, SynthId } from './ToneSynthContainer'
import { ToneSynthUI } from './ToneSynthUI'
import { Keyboard } from './Keyboard'
import { Select } from './Select'

export class ToneSynth extends React.Component {
    render() {
        return (
            <ToneSynthContainer>
                {props => (
                    <div>
                        <Select
                            id="synth_select"
                            label="Synth"
                            selectValues={props.synthIds}
                            selectedValue={props.selectedSynthId}
                            onSelectedValueChange={({ newSelectedValue }) => props.onSelectedSynthChange({ newSynthId: newSelectedValue as SynthId })}
                        />
                        <ToneSynthUI {...props} />
                        <Keyboard {...props} />
                    </div>
                )}
            </ToneSynthContainer>
        )
    }
}
