import { resolveResource, join } from '@tauri-apps/api/path'
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri'
import { Howl } from 'howler'
import { Component, createEffect, createSignal, onMount, onCleanup } from 'solid-js'
import { debug, info } from 'tauri-plugin-log-api'
import RangeInput from '@components/Slider'

interface PlayerProps {
    src: string
    name: string
    icon: string
    stop: boolean
}

const Player: Component<PlayerProps> = (props) => {
    const [sound, setSound] = createSignal<Howl>()
    const [volume, setVolume] = createSignal(0)
    const [source, setSource] = createSignal('')
    const [sliderValue, setSliderValue] = createSignal(0)

    let playerID = ''

    // TODO: Implement Spatial Audio Plugin for Howler
    // TODO: Implement Dolby Sound
    /* var dolbySound = new Howl({
        src: ['sound.mp4', 'sound.webm', 'sound.mp3'],
        format: ['dolby', 'webm', 'mp3'],
    }) */

    const getResourcePath = async (path: string) => {
        path = await join('audio', path)
        const resourcePath = await resolveResource(path)

        debug(`[Get Resource File Path]: ${resourcePath}`)
        return resourcePath
    }

    const handleBackend = async () => {
        const sound = await getResourcePath(props.src)

        const [scheme, path] = await invoke<Array<string>>('video_uri', {
            path: sound,
        })
        setSource(convertFileSrc(path, scheme))
    }

    onMount(async () => {
        await handleBackend()
        debug('[Player]: Creating audio')
        debug(`[Player]: ${source()}`)
        setSound(
            new Howl({
                src: source(),
                volume: volume(),
                loop: true,
            }),
        )
        debug('[Player]: Loading audio')
    })

    createEffect(() => {
        setVolume(sliderValue() / 100)
        sound()?.volume(volume())
    })

    createEffect(() => {
        if (volume() === 0) {
            sound()?.stop()
        } else if (!sound()?.playing()) {
            debug('[Player]: Playing audio')
            sound()?.play()
        }
    })

    createEffect(() => {
        info(`[Volume]: ${playerID} = ${sliderValue()}%`)
    })

    createEffect(() => {
        if (props.stop) {
            debug('[Player]: Stopping audio')
            setSliderValue(0)
            sound()?.volume(0)
            sound()?.stop()
        }
    })

    onCleanup(() => {
        debug('[Player]: Unloading audio')
        sound()?.stop()
        sound()?.unload()
    })

    return (
        <div class="flex items-center justify-center w-full flex-grow">
            <div class="flex items-center text-gray-800 pr-10 pt-3">
                <div class="appearance-none nm-inset-gray-200 leading-5 flex-grow flex items-center justify-center rounded-full bg-[#e0e0e0] p-3 m-2">
                    <span class={`text-2xl ${props.icon}`} />
                </div>
            </div>
            <div class="text-gray-800 pt-4 justify-start w-full">
                <RangeInput
                    onChange={(value) => {
                        setSliderValue(value.value[0])
                    }}
                    setID={(id) => (playerID = id)}
                    min={0}
                    max={100}
                    value={sliderValue()}
                />
            </div>
        </div>
    )
}

export default Player
