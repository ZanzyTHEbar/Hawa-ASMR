import { For } from 'solid-js'
import GithubIcon from '@components/GithubIcon'
import Player from '@components/Player'
import { useAppContextMain } from '@src/store/context/main'

const Main = () => {
    const { handleAppExit } = useAppContextMain()

    const sounds = [
        {
            name: 'Rain',
            icon: 'i-lucide-cloud-rain',
            src: '/sounds/rain.mp3',
        },
        {
            name: 'Thunder',
            icon: 'i-lucide-cloud-lightning',
            src: '/sounds/thunder.mp3',
        },
        {
            name: 'Wind',
            icon: 'i-lucide-wind',
            src: '/sounds/wind.mp3',
        },
        {
            name: 'Campfire',
            icon: 'i-lucide-flame-kindling',
            src: '/sounds/campfire.mp3',
        },
        {
            name: 'Waves',
            icon: 'i-lucide-waves',
            src: '/sounds/waves.mp3',
        },
        {
            name: 'Coffee Shop',
            icon: 'i-lucide-coffee',
            src: '/sounds/coffee-shop.mp3',
        },
        {
            name: 'Forest',
            icon: 'i-lucide-trees',
            src: '/sounds/forest.mp3',
        },
    ]

    return (
        <main class="rounded-lg bg-gray-100 h-[calc(100vh-8px)] flex flex-col">
            <div class="space-y-4 p-4 flex-1">
                <For each={sounds}>
                    {(sound, index) => (
                        <Player
                            data-index={index()}
                            src={sound.src}
                            name={sound.name}
                            icon={sound.icon}
                        />
                    )}
                </For>
            </div>
            <footer class="flex w-full items-center justify-end p-1">
                <a
                    target="_blank"
                    href="https://github.com/fayazara/hawa"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    <GithubIcon class="h-4 w-4 text-gray-500" fill="black" />
                </a>
                <button
                    /* @click="stopAll" */
                    title="Stop All"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    <span class="h-3 w-3 bg-gray-500 rounded-[1px]" />
                </button>
                <button
                    onClick={() => handleAppExit(true)}
                    title="Exit"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    {/* <Icon class="text-xs" name="i-lucide-power" /> */}
                </button>
            </footer>
        </main>
    )
}

export default Main
