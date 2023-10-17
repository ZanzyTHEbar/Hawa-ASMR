import { exit } from '@tauri-apps/api/process'
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'
import { createContext, useContext, createMemo, type Component, Accessor } from 'solid-js'
import { useEventListener } from 'solidjs-use'
import { attachConsole, info } from 'tauri-plugin-log-api'
import type { Context } from '@static/index'
import type { UnlistenFn } from '@tauri-apps/api/event'
import { usePersistentStore } from '@src/store/tauriStore'
import { ExitCodes } from '@static/enums'

interface AppContextMain {
    getDetachConsole: Accessor<Promise<UnlistenFn>>
    handleAppBoot: () => void
    handleAppExit: (main?: boolean) => Promise<void>
}

const AppContextMain = createContext<AppContextMain>()
export const AppContextMainProvider: Component<Context> = (props) => {
    const detachConsole = attachConsole()

    const getDetachConsole = createMemo(() => detachConsole)
    //#region Global Hooks
    const handleAppExit = async (main = false) => {
        await invoke('handle_save_window_state')
        info('[App Close]: saved window state')

        if (main) {
            const { save } = usePersistentStore()
            await save()
            // saveSettings()
            await exit(ExitCodes.USER_EXIT)
        }
        await appWindow.close()
    }

    const handleAppBoot = () => {
        const { set, get } = usePersistentStore()

        info('[App Boot]: Frontend Initialization Starting')
        useEventListener(document, 'DOMContentLoaded', () => {
            invoke('get_user')
                .then((config) => {
                    const userName = config as string
                    info(`[App Boot]: Welcome ${userName}`)
                    get('settings').then((settings) => {
                        if (userName) {
                            set('settings', { user: userName, ...settings })
                        }
                    })
                })
                .catch((e) => console.error(e))
            // check if the window state is saved and restore it if it is
            invoke('handle_save_window_state').then(() => {
                info('[App Boot]: saved window state')
            })
        })

        //TODO: Start mdns and websocket clients only after the backend is ready
        // TODO: call REST api to start the backend
    }
    //#endregion

    return (
        <AppContextMain.Provider
            value={{
                getDetachConsole,
                handleAppBoot,
                handleAppExit,
            }}>
            {props.children}
        </AppContextMain.Provider>
    )
}

export const useAppContextMain = () => {
    const context = useContext(AppContextMain)
    if (context === undefined) {
        throw new Error('useAppContextMain must be used within a AppContextMainProvider')
    }
    return context
}
