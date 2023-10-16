import { invoke } from '@tauri-apps/api/tauri'
import { createSignal } from 'solid-js'

const Greet = () => {
    const [greetMsg, setGreetMsg] = createSignal('')
    const [name, setName] = createSignal('')

    const greet = async (e) => {
        e.preventDefault()
        /* greetMsg.value = await invoke("greet", { name: name.value }); */
    }

    return (
        <div>
            <form class="row" onSubmit={greet}>
                <input id="greet-input" v-model="name" placeholder="Enter a name..." />
                <button type="submit">Greet</button>
            </form>
            <p>{greetMsg()}</p>
        </div>
    )
}

export default Greet
