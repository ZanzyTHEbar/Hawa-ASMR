import { lazy } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

const Home = lazy(() => import('@pages/main'))
const page404 = lazy(() => import('@pages/404'))

export const routes: RouteDefinition[] = [
    { path: '/', component: Home },
    { path: '**', component: page404 },
]
