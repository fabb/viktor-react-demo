import * as React from 'react'

interface SelectProps {
    id: string
    label: string
    placeholder?: string
    selectValues: string[]
    selectedValue: string
    onSelectedValueChange: (x: { newSelectedValue: string }) => void
}

export const Select = ({ placeholder = 'loading...', ...props }: SelectProps) => {
    const selectRef = React.createRef<HTMLSelectElement>()
    return (
        <div>
            <label htmlFor={props.id}>{`${props.label}: `}</label>
            <select
                ref={selectRef}
                id={props.id}
                value={props.selectedValue}
                onChange={event => {
                    const newSelectedValue = event.target.value
                    props.onSelectedValueChange({ newSelectedValue })
                    selectRef.current!.blur()
                }}
            >
                {props.selectValues
                    ? props.selectValues.map(value => {
                          return (
                              <option key={value} value={value}>
                                  {value}
                              </option>
                          )
                      })
                    : placeholder}
            </select>
        </div>
    )
}
