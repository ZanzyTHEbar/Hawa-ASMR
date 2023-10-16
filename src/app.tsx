import { lazy, onMount, Suspense } from 'solid-js'
import { useAppContextMain } from './store/context/main'
import { AppProvider } from '@store/context/app'

const AppRoutes = lazy(() => import('@routes/Routes'))

const App = () => {
    const { handleAppBoot } = useAppContextMain()
    //const ref = document.getElementById('titlebar')
    onMount(() => {
        handleAppBoot()
    })

    return (
        <div class="App overflow-y-auto items-center">
            <Suspense>
                <AppProvider>
                    <AppRoutes />
                </AppProvider>
            </Suspense>
        </div>
    )
}

export default App
