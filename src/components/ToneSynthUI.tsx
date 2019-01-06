import * as React from 'react'
import { ToneSynthContainerRenderFuncProps } from './ToneSynthContainer'
import { Select } from './Select'
import { SynthParameter, SynthId, isDiscreteParameterValues, isParameterValueRange } from '../synths/synths'
import { Keyboard } from './Keyboard'
import { Knob } from 'react-rotary-knob'
import '../App.css'

export const ToneSynthUI = (props: ToneSynthContainerRenderFuncProps) => (
    <div className="default-margins">
        <div className="default-margins">
            <button onClick={props.startSong}>Start Song</button>
            <button onClick={props.stopSong}>Stop Song</button>
        </div>
        <Select
            id="synth_select"
            label="Synth"
            selectValues={props.synthIds}
            selectedValue={props.selectedSynthId}
            onSelectedValueChange={({ newSelectedValue }) => props.onSelectedSynthChange({ newSynthId: newSelectedValue as SynthId })}
        />
        <SynthSpecificUI {...props} />
        <Keyboard {...props} />
    </div>
)

const SynthSpecificUI = (props: ToneSynthContainerRenderFuncProps) => {
    const synthParameters = props.synthParameters[props.selectedSynthId] || []
    return (
        <React.Fragment>
            {synthParameters.map(synthParameter => (
                <SynthParameterUI key={synthParameter.name} synthId={props.selectedSynthId} synthParameter={synthParameter} onChangeParameter={props.onChangeParameter} />
            ))}
        </React.Fragment>
    )
}

interface SynthParameterUIProps {
    synthId: SynthId
    synthParameter: SynthParameter
    onChangeParameter: (synthId: SynthId, parameterName: string, parameterValue: any) => void
}

const SynthParameterUI = (props: SynthParameterUIProps) => {
    switch (props.synthParameter.controlType) {
        case 'select':
            if (isDiscreteParameterValues(props.synthParameter.values)) {
                return (
                    <div className="default-margins">
                        <Select
                            id={`synth-parameter-${props.synthParameter.name.replace('.', '-')}`}
                            label={props.synthParameter.description}
                            selectValues={props.synthParameter.values.values}
                            selectedValue={props.synthParameter.value()}
                            onSelectedValueChange={({ newSelectedValue }) => props.onChangeParameter(props.synthId, props.synthParameter.name, newSelectedValue)}
                        />
                    </div>
                )
            } else {
                throw 'select only works with DiscreteParameterValues'
            }
        case 'knob':
            if (isParameterValueRange(props.synthParameter.values)) {
                return (
                    <div className="default-margins centering">
                        <div className="column-flex">
                            <Knob
                                onChange={(newValue: number) => props.onChangeParameter(props.synthId, props.synthParameter.name, newValue)}
                                value={props.synthParameter.value()}
                                min={props.synthParameter.values.valueRange.min}
                                max={props.synthParameter.values.valueRange.max}
                            />
                            <p>{props.synthParameter.description}</p>
                            <p>{props.synthParameter.value().toFixed(2)}</p>
                        </div>
                    </div>
                )
            } else {
                throw 'TODO discrete knobs'
            }
    }
}
