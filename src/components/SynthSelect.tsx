import * as React from 'react'
import { ToneSynthContainerRenderFuncProps, SynthId } from './ToneSynthContainer'

export const SynthSelect = ({
    synthIds,
    selectedSynthId,
    onSelectedSynthChange: onSelectedSynthChange,
}: Pick<ToneSynthContainerRenderFuncProps, 'synthIds' | 'selectedSynthId' | 'onSelectedSynthChange'>) => {
    const selectRef = React.createRef<HTMLSelectElement>()
    return (
        <div>
            <label htmlFor="synth_select">Synth: </label>
            <select
                ref={selectRef}
                id="synth_select"
                value={selectedSynthId}
                onChange={event => {
                    const newSynthId = event.target.value as SynthId
                    onSelectedSynthChange({ newSynthId: newSynthId })
                    selectRef.current!.blur()
                }}
            >
                {synthIds
                    ? synthIds.map(synthId => {
                          return (
                              <option key={synthId} value={synthId}>
                                  {synthId}
                              </option>
                          )
                      })
                    : 'loading...'}
            </select>
        </div>
    )
}
