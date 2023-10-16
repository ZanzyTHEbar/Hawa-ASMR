const Main = () => {
    return (
        <main class="rounded-lg bg-gray-100 h-[calc(100vh-8px)] flex flex-col">
            <div class="space-y-4 p-4 flex-1">
                {/* <Player
        v-for="(sound, i) in sounds"
        :key="i"
        :src="sound.src"
        :name="sound.name"
        :icon="sound.icon"
      /> */}
            </div>
            <footer class="flex w-full items-center justify-end p-1">
                <a
                    target="_blank"
                    href="https://github.com/fayazara/hawa"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    {/*   <GithubIcon class="h-4 w-4 text-gray-500" /> */}
                </a>
                <button
                    /* @click="stopAll" */
                    title="Stop All"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    <span class="h-3 w-3 bg-gray-500 rounded-[1px]"></span>
                </button>
                <button
                    /* @click="exitApp" */
                    title="Exit"
                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none">
                    {/* <Icon class="text-xs" name="i-lucide-power" /> */}
                </button>
            </footer>
        </main>
    )
}

export default Main
