import * as React from 'react'
import { ToneSynthContainerRenderFuncProps } from './ToneSynthContainer'
import { Select } from './Select'
import { SynthParameter, SynthId } from '../synths/synths'
import { Keyboard } from './Keyboard'
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
    switch (props.selectedSynthId) {
        case 'Tone Synth':
        case 'Tone MembraneSynth':
        case 'Tone MetalSynth':
        case 'ViktorTone Synth':
            return (
                <React.Fragment>
                    {synthParameters.map(synthParameter => (
                        <SynthParameterUI key={synthParameter.name} synthId={props.selectedSynthId} synthParameter={synthParameter} onChangeParameter={props.onChangeParameter} />
                    ))}
                </React.Fragment>
            )
        case 'Viktor':
            return (
                <div className="default-margins">
                    <Select
                        id="patch"
                        label="Patch"
                        selectValues={props.viktorParameters.patchNames}
                        selectedValue={props.viktorParameters.selectedPatchName}
                        onSelectedValueChange={({ newSelectedValue }) => props.viktorParameters.onPatchChange({ newPatchName: newSelectedValue })}
                    />
                </div>
            )
    }
}

interface SynthParameterUIProps {
    synthId: SynthId
    synthParameter: SynthParameter
    onChangeParameter: (synthId: SynthId, parameterName: string, parameterValue: any) => void
}

const SynthParameterUI = (props: SynthParameterUIProps) => {
    switch (props.synthParameter.controlType) {
        case 'select':
            return (
                <div className="default-margins">
                    <Select
                        id={`synth-parameter-${props.synthParameter.name.replace('.', '-')}`}
                        label={props.synthParameter.description}
                        selectValues={props.synthParameter.values}
                        selectedValue={props.synthParameter.value()}
                        onSelectedValueChange={({ newSelectedValue }) => props.onChangeParameter(props.synthId, props.synthParameter.name, newSelectedValue)}
                    />
                </div>
            )
    }
}
