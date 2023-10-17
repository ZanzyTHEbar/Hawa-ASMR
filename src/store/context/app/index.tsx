import { createContext, useContext, createMemo, type Component, Accessor } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { attachConsole } from 'tauri-plugin-log-api'
import { AppNotificationProvider } from '../notifications'
import { AppUIProvider } from '../ui'
import type { Context, DebugMode } from '@static/index'
import type { AppStore } from '@static/interfaces'
import type { UnlistenFn } from '@tauri-apps/api/event'

// TODO: Add profiles to save settings in the persistent store
// TODO: Add a way to reset the persistent store
// TODO: Implement saving src and volume levels of each player for a profile

interface AppContext {
    getDetachConsole: Accessor<Promise<UnlistenFn>>
    getDebugMode: Accessor<DebugMode>
    setDebugMode: (mode: DebugMode | undefined) => void
}

const AppContext = createContext<AppContext>()
export const AppProvider: Component<Context> = (props) => {
    const detachConsole = attachConsole()

    //#region Store
    const defaultState: AppStore = {
        debugMode: 'off',
    }

    const [state, setState] = createStore<AppStore>(defaultState)

    const setDebugMode = (mode: DebugMode | undefined) => {
        setState(
            produce((s) => {
                s.debugMode = mode || 'info'
            }),
        )
    }

    const appState = createMemo(() => state)
    const getDebugMode = createMemo(() => appState().debugMode)
    const getDetachConsole = createMemo(() => detachConsole)
    //#endregion

    return (
        <AppContext.Provider
            value={{
                getDetachConsole,
                getDebugMode,
                setDebugMode,
            }}>
            <AppUIProvider>
                <AppNotificationProvider>{props.children}</AppNotificationProvider>
            </AppUIProvider>
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppProvider')
    }
    return context
}
