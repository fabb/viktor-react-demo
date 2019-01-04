import * as React from 'react'
import { ToneSynthContainerRenderFuncProps } from './ToneSynthContainer'
import { Select } from './Select'
import '../App.css'

export const ToneSynthUI = (props: ToneSynthContainerRenderFuncProps) => (
    <div className="default-margins">
        <div className="default-margins">
            <button onClick={props.startSong}>Start Song</button>
            <button onClick={props.stopSong}>Stop Song</button>
        </div>
        <SynthSpecificUI {...props} />
    </div>
)

const SynthSpecificUI = (props: ToneSynthContainerRenderFuncProps) => {
    switch (props.selectedSynthId) {
        case 'bass':
        case 'kick':
        case 'hh':
        case 'viktorTone':
            return null // no UI yet
        case 'viktor':
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
