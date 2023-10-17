import { useLocation, useNavigate, useRoutes } from '@solidjs/router'
import { isEqual } from 'lodash'
import { createEffect, onMount, type Component, createSignal } from 'solid-js'
import { useEventListener, useInterval } from 'solidjs-use'
import { debug, error } from 'tauri-plugin-log-api'
import { routes } from '.'
import type { PersistentSettings } from '@static/index'
import { ENotificationAction, ENotificationType } from '@static/enums'
import { useAppContext } from '@store/context/app'
import { useAppNotificationsContext } from '@store/context/notifications'
import { useAppUIContext } from '@store/context/ui'
import { usePersistentStore } from '@store/tauriStore'
import { isEmpty } from '@utils/index'

const AppRoutes: Component = () => {
    const [userIsInSettings, setUserIsInSettings] = createSignal(false)
    const params = useLocation()

    const Path = useRoutes(routes)
    const { get, set } = usePersistentStore()
    const navigate = useNavigate()

    const { setDebugMode, getDebugMode } = useAppContext()
    const {
        setEnableNotifications,
        setEnableNotificationsSounds,
        setGlobalNotificationsType,
        getEnableNotificationsSounds,
        getEnableNotifications,
        getGlobalNotificationsType,
        checkPermission,
        addNotification,
    } = useAppNotificationsContext()
    const { connectedUserName, setConnectedUser } = useAppUIContext()

    onMount(() => {
        //* load the app settings from the persistent store and assign to the global state
        get('settings').then((settings) => {
            if (settings) {
                debug('loading settings')
                const activeUserName =
                    typeof settings.user === 'string' ? settings.user : 'stranger'

                setConnectedUser(activeUserName)
                setEnableNotifications(settings.enableNotifications)
                setEnableNotificationsSounds(settings.enableNotificationsSounds)
                setGlobalNotificationsType(
                    settings.globalNotificationsType ?? ENotificationAction.APP,
                )

                setDebugMode(settings.debugMode)
                debug(`[Routes]: Settings Loaded - ${JSON.stringify(settings)}`)
            }
        })
        //* Check notification permissions
        checkPermission()
        //* Grab the github release info for OpenIris

        // TODO: Implement media server discovery
        //* Scan for local dlna 7 media servers
    })

    const createSettingsObject = () => {
        const settings: PersistentSettings = {
            user: connectedUserName(),
            enableNotifications: getEnableNotifications(),
            enableNotificationsSounds: getEnableNotificationsSounds(),
            globalNotificationsType: getGlobalNotificationsType(),
            debugMode: getDebugMode(),
        }
        return settings
    }

    const handleSaveSettings = async () => {
        // check if the settings have changed and save to the store if they have
        get('settings').then((storedSettings) => {
            if (!isEqual(storedSettings, createSettingsObject())) {
                debug(`[Routes]: Saving Settings - ${JSON.stringify(createSettingsObject())}`)
                set('settings', createSettingsObject())
            }
        })
    }

    createEffect(() => {
        const { resume, pause } = useInterval(30000, {
            controls: true,
            callback: handleSaveSettings,
        })

        useEventListener(window, 'blur', () => {
            pause()
            debug(`[Routes]: Saving Settings - ${JSON.stringify(createSettingsObject())}`)
            set('settings', createSettingsObject())
            resume()
        })
    })

    createEffect(() => {
        setUserIsInSettings(params.pathname.match('settings') !== null)
    })

    return (
        <main class="w-full">
            {/* <div class="header-wrapper">
                <Header
                    hideButtons={userIsInSettings()}
                    name={connectedUserName() ? `Welcome${connectedUserName()}` : 'Welcome!'}
                    onClick={() => navigate('/')}
                />
            </div> */}
            <Path />
        </main>
    )
}

export default AppRoutes
