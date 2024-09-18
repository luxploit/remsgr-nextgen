import express, { Express, RequestHandler, Router } from 'express'
import { Controller } from './core/controller'
import { AuthorizationProvider } from './authorization/provider'
import { FlareSettings } from './settings'
import { RegisterExpressExtensions } from './extension/handler'
import { FlareExpressApp } from './extension/types'

export type FlareEngine = (
	path: string,
	options: object,
	callback: (e: any, rendered?: string) => void
) => void

export class FlareApp {
	private readonly app: FlareExpressApp
	private middlewares: RequestHandler[] = []

	constructor() {
		this.app = express()
		this.app.use((req, res, next) => {
			RegisterExpressExtensions(req, res, next)
		})
	}

	useAuthorization(auth: AuthorizationProvider): this {
		this.app.auth = auth
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
		controller.setup(this.app)
		return this
	}

	useControllers(controllers: Controller[]): this {
		controllers.forEach((controller) => controller.setup(this.app))
		return this
	}

	useRouter(path: string, router: Router): this {
		this.app.use(path, router)
		return this
	}

	useRouters(routers: { path: string; router: (app: FlareExpressApp) => Router }[]): this {
		routers.forEach((router) => this.app.use(router.path, router.router(this.app)))
		return this
	}

	usePublic(virtualPath: string, rootPath: string): this {
		this.app.use(virtualPath, express.static(rootPath))
		return this
	}

	useViewEngine(engine: string, middleware: FlareEngine, path: string): this {
		this.useSettings('views').set(path)
		this.useSettings('view engine').set(engine)
		this.app.engine(engine, middleware)
		return this
	}

	useSettings(key: string): FlareSettings {
		return new FlareSettings(this.app, key)
	}

	build(): FlareExpressApp {
		this.middlewares.forEach((middleware) => this.app.use(middleware))
		return this.app
	}
}
