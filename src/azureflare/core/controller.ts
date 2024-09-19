import { Application, Router } from 'express'
import { getRoutes } from '../core/endpoint'
import { FlareExpressApp, FlareExpressRouter, FlareRequest, FlareResponse } from '../extension/types'
import { getMiddlewares } from '../core/middleware'
import { AuthorizationProvider, getAuthorization, isAnonymous } from '../authorization/provider'
import { getConfigs } from './config'
import { FlareSettings } from '../settings'

export abstract class Controller {
	setup = (app: FlareExpressApp, router?: FlareExpressRouter) => {
		const configs = getConfigs(this)
		configs.forEach((config) => {
			;(this as any)[config](new FlareSettings(app))
		})

		const routes = getRoutes(this)
		routes.forEach((route) => {
			const controllerMiddlewares = getMiddlewares(this)
			const endpointMiddlewares = getMiddlewares(this, route.methodName)

			const globalAuth = app.auth
			const routerAuth = router?.auth
			const controllerAuth = getAuthorization(this)
			const endpointAuth = getAuthorization(this, route.methodName)
			const finalAuth = controllerAuth ?? endpointAuth ?? routerAuth ?? globalAuth

			const middlewares = [...controllerMiddlewares, ...endpointMiddlewares]

			if (finalAuth && !isAnonymous(this) && !isAnonymous(this, route.methodName)) {
				middlewares.unshift(finalAuth.authorize.bind(finalAuth))
			}

			if (router) {
				router[route.verb](
					route.url,
					middlewares,
					(request: FlareRequest, response: FlareResponse) => {
						;(this as any)[route.methodName](request, response)
					}
				)

				console.log('registering router route', route.verb, route.url, route.methodName)
			} else {
				app[route.verb](
					route.url,
					middlewares,
					(request: FlareRequest, response: FlareResponse) => {
						;(this as any)[route.methodName](request, response)
					}
				)

				console.log('registering global route', route.verb, route.url, route.methodName)
			}
		})
	}
}
