import * as React from 'react'
import { ToneSynthContainerRenderFuncProps } from './ToneSynthContainer'

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
            return <p>TODO Viktor GUI</p>
    }
}
