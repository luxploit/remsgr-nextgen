import express, { Application, RequestHandler, Router } from 'express'
import { AuthorizationProvider } from './authorization/provider'
import { Controller } from './core/controller'
import { FlareApp, FlareEngine } from './app'
import { FlareSettings } from './settings'
import { FlareExpressApp, FlareExpressRouter } from './extension/types'

export class FlareRouter {
	private readonly router: FlareExpressRouter
	private middlewares: RequestHandler[] = []
	private auth?: AuthorizationProvider

	constructor(private readonly app: FlareExpressApp) {
		this.router = Router()
	}

	useAuthorization(auth: AuthorizationProvider): this {
		this.auth = auth
		return this
	}

	useMiddleware(middleware: RequestHandler): this {
		this.middlewares.push(middleware)
		return this
	}

	useMiddlewares(middlewares: RequestHandler[]): this {
		this.middlewares = [...this.middlewares, ...middlewares]
		return this
	}

	useController(controller: Controller): this {
		controller.setup(this.app, this.router)
		return this
	}

	useControllers(controllers: Controller[]): this {
		controllers.forEach((controller) => controller.setup(this.app, this.router))
		return this
	}

	usePublic(virtualPath: string, rootPath: string): this {
		this.router.use(virtualPath, express.static(rootPath))
		return this
	}

	useAppSettings(key: string): FlareSettings {
		return new FlareSettings(this.app, key)
	}

	build(): FlareExpressRouter {
		this.middlewares.forEach((middleware) => this.router.use(middleware))
		return this.router
	}
}

type FlareRouterInitializer = (app: FlareRouter) => void
export const createFlareRouter = (initializer: FlareRouterInitializer) => (app: FlareExpressApp) => {
	const router = new FlareRouter(app)
	initializer(router)
	return router.build()
}
