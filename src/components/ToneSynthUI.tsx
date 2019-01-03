import * as React from 'react'
import { ToneSynthContainerRenderFuncProps } from './ToneSynthContainer'
import { Select } from './Select'

export const ToneSynthUI = (props: ToneSynthContainerRenderFuncProps) => (
    <div>
        <div>
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
            return null // no UI yet
        case 'viktor':
            return (
                <div>
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
