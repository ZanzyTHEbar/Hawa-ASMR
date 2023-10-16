import { Accessor, createContext, createMemo, useContext, type Component } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import type { Context } from '@static/index'
import { MenuOpen, UiStore } from '@src/static/interfaces'

interface AppUIContext {
    openModalStatus: Accessor<boolean | undefined>
    menuOpenStatus: Accessor<MenuOpen | null | undefined>
    connectedUserName: Accessor<string>
    showNotifications: Accessor<boolean | undefined>
    setMenu: (menuOpen: MenuOpen | null) => void
    setOpenModal: (openModal: boolean) => void
    setConnectedUser: (userName: string) => void
}

const AppUIContext = createContext<AppUIContext>()
export const AppUIProvider: Component<Context> = (props) => {
    const defaultState: UiStore = {
        openModal: false,
        menuOpen: null,
        connectedUser: '',
        showNotifications: true,
    }

    const [state, setState] = createStore<UiStore>(defaultState)

    const setMenu = (menuOpen: MenuOpen | null) => {
        setState(
            produce((s) => {
                s.menuOpen = menuOpen || null
            }),
        )
    }

    const setOpenModal = (openModal: boolean) => {
        setState(
            produce((s) => {
                s.openModal = openModal
            }),
        )
    }

    const setConnectedUser = (userName: string) => {
        setState(
            produce((s) => {
                s.connectedUser = userName
            }),
        )
    }

    const uiState = createMemo(() => state)

    const openModalStatus = createMemo(() => uiState().openModal)
    const menuOpenStatus = createMemo(() => uiState().menuOpen)
    const connectedUserName = createMemo(() => uiState().connectedUser)

    const showNotifications = createMemo(() => uiState().showNotifications)

    return (
        <AppUIContext.Provider
            value={{
                openModalStatus,
                menuOpenStatus,
                connectedUserName,
                showNotifications,
                setMenu,
                setOpenModal,
                setConnectedUser,
            }}>
            {props.children}
        </AppUIContext.Provider>
    )
}

export const useAppUIContext = () => {
    const context = useContext(AppUIContext)
    if (context === undefined) {
        throw new Error('useAppUIContext must be used within an AppUIProvider')
    }
    return context
}
