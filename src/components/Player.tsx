import { Howl } from 'howler'
import { Component, createEffect, createSignal, onMount, onCleanup } from 'solid-js'
import { error } from 'tauri-plugin-log-api'
import RangeInput from '@components/RangeInput'

interface PlayerProps {
    src: string
    name: string
    icon: string
}

const Player: Component<PlayerProps> = (props) => {
    const [sound, setSound] = createSignal<Howl | null>(null)
    const [volume, setVolume] = createSignal(0)

    // TODO: Implement Spatial Audio Plugin for Howler
    // TODO: Implement Dolby Sound
    /* var dolbySound = new Howl({
        src: ['sound.mp4', 'sound.webm', 'sound.mp3'],
        format: ['dolby', 'webm', 'mp3'],
    }) */

    createEffect(() => {
        if (sound()) {
            const value = volume() / 100
            if (value === 0) {
                sound()!.stop()
            } else if (!sound()!.playing()) {
                sound()!.play()
            }
        }
    })

    onMount(() => {
        setSound(
            new Howl({
                src: [props.src],
                volume: volume() / 100,
                loop: true,
            }),
        )

        console.log('[Player]: Loading audio')
        
        sound()!.on('loaderror', () => {
            console.error('[Player]: Error loading audio')
            error('[Player]: Error loading audio')
        })

        if (volume() > 0) {
            sound()!.play()
        }

        // TODO: Hook into stopAll event from footer
        /* emitter.on('stopAll', () => {
            sound.value.stop()
            sliderValue.value = [0]
        }) */
    })

    onCleanup(() => {
        if (sound()) {
            sound()!.stop()
            sound()!.unload()
        }
    })
    return (
        <div class="flex items-center justify-center w-full flex-grow">
            <div class="flex items-center text-gray-800 pr-10 pt-2">
                <div class="appearance-none nm-inset-gray-200 leading-5 flex-grow flex items-center justify-center rounded-full bg-[#e0e0e0] p-3 m-2">
                    <span class={`text-2xl ${props.icon}`} />
                </div>
            </div>
            <div class="text-gray-800 pt-4 justify-start w-full">
                <RangeInput
                    onChange={(value) => {
                        setVolume(value.value[0])
                    }}
                    format="percent"
                    disablePercent
                    min={0}
                    max={100}
                />
            </div>
        </div>
    )
}

export default Player

/* <SliderRoot
      v-model="sliderValue"
      class="relative flex items-center select-none touch-none w-full h-5 flex-1"
      :min="0"
      :max="100"
      :step="1"
    >
      <SliderTrack
        class="bg-gray-200 relative grow rounded-full h-5 overflow-hidden border border-gray-300"
      >
        <SliderRange class="absolute bg-white h-full" />
      </SliderTrack>
      <SliderThumb
        class="w-5 h-5 flex items-center justify-center gap-0.5 rounded-full bg-white shadow border border-gray-300 focus:outline-none focus:bg-gray-100"
        aria-label="Volume"
      >
      </SliderThumb>
    </SliderRoot> */
