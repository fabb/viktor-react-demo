import * as React from 'react'
import { ToneSynthContainer } from './ToneSynthContainer'
import { ToneSynthUI } from './ToneSynthUI'
import { Keyboard } from './Keyboard'
import { Select } from './Select'
import { SynthId } from '../synths/synths'
import '../App.css'

export class ToneSynth extends React.Component {
    render() {
        return (
            <ToneSynthContainer>
                {props => (
                    <div className="default-margins">
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
