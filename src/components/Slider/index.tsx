import * as slider from '@zag-js/slider'
import { normalizeProps, useMachine } from '@zag-js/solid'
import { createEffect, createMemo, createUniqueId, onMount } from 'solid-js'

import './styles.css'
import { debug } from 'tauri-plugin-log-api'

export interface IProps {
    onChange: (details: { value: number[] }) => void
    setID: (id: string) => void
    min: number
    max: number
}

const RangeInput = (props: IProps) => {
    const id = createUniqueId()

    const [state, send] = useMachine(
        slider.machine({
            id: id,
            min: 0,
            max: 100,
            step: 0.02,
            'aria-label': ['Volume'],
            value: [0],
            onValueChange: props.onChange,
        }),
        {
            context: {
                min: props.min,
                max: props.max,
            },
        },
    )

    const api = createMemo(() => slider.connect(state, send, normalizeProps))

    createEffect(() => {
        debug(`[Max Updated]: ${props.max}`)
        state.context.max = props.max
    })

    createEffect(() => {
        debug(`[RangeValue]: ${api().value}`)
    })

    onMount(() => {
        props.setID(id)
    })

    return (
        <div class="items-center nm-flat-gray-100-xs rounded-md p-2">
            <div {...api().rootProps}>
                <div class="flex items-center" {...api().controlProps}>
                    <div {...api().trackProps}>
                        <div {...api().rangeProps} />
                    </div>
                    <div {...api().getThumbProps({ index: 0 })}>
                        <div class="grip" />
                        <input {...api().getHiddenInputProps({ index: 0 })} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RangeInput
