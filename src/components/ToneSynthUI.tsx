import * as React from 'react'
import { ToneSynthContainerRenderFuncProps } from './ToneSynthContainer'

export const ToneSynthUI = (props: ToneSynthContainerRenderFuncProps) => (
    <div>
        <button onClick={props.startSong}>Start Song</button>
        <button onClick={props.stopSong}>Stop Song</button>
    </div>
)
