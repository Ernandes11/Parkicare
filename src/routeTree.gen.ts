import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as loginRoute } from './routes/login'

const indexRouteWithParent = indexRoute._addInjectedRoot(rootRoute)
const loginRouteWithParent = loginRoute._addInjectedRoot(rootRoute)

export const routeTree = rootRoute._addInjectedChildren([
  indexRouteWithParent,
  loginRouteWithParent,
])
