import * as slider from '@zag-js/slider'
import { normalizeProps, useMachine } from '@zag-js/solid'
import { createEffect, createSignal, onCleanup, createMemo, For, createUniqueId } from 'solid-js'
import { useEventListener } from 'solidjs-use'
import { debug } from 'tauri-plugin-log-api'
import { BULLET_POSITION_ADJUSTMENT, getBulletPosition } from '@src/utils'
import './styles.css'

export interface IProps {
    onChange: (details: { value: number[] }) => void
    format?: string
    disablePercent?: boolean
    defaultValue?: number
    min: number
    max: number
}

const RangeInput = (props: IProps) => {
    const [uiHasMoved, setUiHasMoved] = createSignal<number>(window.innerWidth)
    const [rangeSliderWidth, setRangeSliderWidth] = createSignal<number | undefined>(undefined)
    const [rangeValue, setRangeValue] = createSignal(0)

    const [state, send] = useMachine(
        slider.machine({
            id: createUniqueId(),
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
        console.log('whoops', props.defaultValue)
    })
    createEffect(() => {
        console.log('[Max Updated]: ', props.max)
        state.context.max = props.max
    })

    let rangeSliderRef: HTMLInputElement | undefined
    let rangeBulletRef: HTMLSpanElement | undefined

    createEffect(() => {
        setTimeout(() => {
            if (!rangeSliderRef || !rangeBulletRef) return

            const range = rangeSliderRef as HTMLInputElement
            const bullet = rangeBulletRef as HTMLSpanElement

            const cleanup = useEventListener(range, 'input', () => {
                setRangeValue(+range.value)
                const bulletPosition = getBulletPosition(range)
                const sliderWidth = rangeSliderWidth() || range.clientWidth

                range.style.backgroundSize =
                    ((+range.value - +range.min) * 100) / (+range.max - +range.min) + '% 100%'

                bullet.style.left =
                    bulletPosition * (sliderWidth - BULLET_POSITION_ADJUSTMENT) + 'px'
            })

            return () => {
                debug('[RangeInput - range input]: cleaning up')
                cleanup()
            }
        })
    })
    createEffect(() => {
        const cleanup = useEventListener(window, 'resize', () => {
            setTimeout(() => {
                if (uiHasMoved() === window.innerWidth) return
                if (!rangeSliderRef || !rangeBulletRef) return

                const range = rangeSliderRef as HTMLInputElement
                const bullet = rangeBulletRef as HTMLSpanElement
                const bulletPosition = getBulletPosition(range)
                const sliderWidth = range.clientWidth

                range.style.backgroundSize =
                    ((+range.value - +range.min) * 100) / (+range.max - +range.min) + '% 100%'

                bullet.style.left =
                    bulletPosition * (sliderWidth - BULLET_POSITION_ADJUSTMENT) + 'px'

                setUiHasMoved(window.innerWidth)
                setRangeSliderWidth(sliderWidth)
            })
        })
        onCleanup(() => {
            debug('[RangeInput - window resize]: cleaning up')
            cleanup()
        })
    })

    createEffect(() => {
        console.log('[RangeValue]: ', api().value)
    })

    return (
        <div>
            {/* <span ref={rangeBulletRef} class="rs-label">
                {rangeValue()}
                {!props.disablePercent ? '%' : ' '}
            </span>
            <div class="range-wrapper horizontal">
                <div class="slider-fill" />
                <input
                    onMouseEnter={() => rangeBulletRef?.classList.add('rs-background')}
                    onMouseLeave={() => rangeBulletRef?.classList.remove('rs-background')}
                    ref={rangeSliderRef}
                    onChange={() => props.onChange(rangeValue(), props.format ?? '')}
                    class="rs-range"
                    type="range"
                    value={rangeValue()}
                    min="0"
                    max="100"
                    step="0.02"
                    aria-label="Volume"
                />
                <div class="slider-thumb" />
            </div> */}
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
        </div>
    )
}

export default RangeInput
