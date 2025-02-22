import { appLogDir } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/api/shell'
import { For, createSignal } from 'solid-js'
import GithubIcon from '@components/GithubIcon'
import Player from '@components/Player'
import { useAppContextMain } from '@src/store/context/main'

interface Sound {
    name: string
    icon: string
    src: string
}

const Main = () => {
    const [stopAll, setStopAll] = createSignal(false)

    const { handleAppExit } = useAppContextMain()

    const handleStopAll = () => {
        setStopAll(true)
    }

    const handleConfigDir = () => {
        appLogDir().then((dir) => {
            console.log(dir)
            open(dir).then(() => console.log('opened'))
        })
    }

    const sounds: Sound[] = [
        {
            name: 'Rain',
            icon: 'i-lucide-cloud-rain',
            src: 'rain.mp3',
        },
        {
            name: 'Thunder',
            icon: 'i-lucide-cloud-lightning',
            src: 'thunder.mp3',
        },
        {
            name: 'Wind',
            icon: 'i-lucide-wind',
            src: 'wind.mp3',
        },
        {
            name: 'Campfire',
            icon: 'i-lucide-flame-kindling',
            src: 'campfire.mp3',
        },
        {
            name: 'Waves',
            icon: 'i-lucide-waves',
            src: 'waves.mp3',
        },
        {
            name: 'Coffee Shop',
            icon: 'i-lucide-coffee',
            src: 'coffee-shop.mp3',
        },
        {
            name: 'Forest',
            icon: 'i-lucide-trees',
            src: 'forest.mp3',
        },
    ]

    return (
        <div class="rounded-lg bg-gray-100 h-[calc(100vh-8px)] pt-6 flex flex-col">
            <div class="space-y-4 p-4 flex-1">
                <For each={sounds}>
                    {(sound, index) => (
                        <Player
                            data-index={index()}
                            src={sound.src}
                            name={sound.name}
                            icon={sound.icon}
                            stop={stopAll()}
                        />
                    )}
                </For>
            </div>
            <footer class="flex gap-2 w-full items-center justify-end p-1">
                <img
                    class="drop-shadow-2xl mr-16 pl-3 flex items-center justify-start rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    src="signature.png"
                    width={175}
                    height={250}
                />
                <a
                    target="_blank"
                    href="https://github.com/ZanzyTHEbar/Vibin"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    <GithubIcon width={25} height={25} class="text-gray-500" fill="black" />
                </a>
                <button
                    onClick={handleStopAll}
                    title="Stop All"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    <span class="h-5 w-5 bg-gray-500 rounded-[1px]" />
                </button>
                <button
                    onClick={() => handleAppExit(true)}
                    title="Exit"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    <span class="text-2xl i-lucide-power" />
                </button>
                <button
                    onClick={handleConfigDir}
                    title="Logs"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    <span class="text-2xl i-lucide-bug" />
                </button>
            </footer>
        </div>
    )
}

export default Main
