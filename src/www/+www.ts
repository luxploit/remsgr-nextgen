import cookieParser from 'cookie-parser'
import cors from 'cors'

import { FlareApp, FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'
import { json, urlencoded } from 'express'
import { engine } from 'express-handlebars'
import { logging } from './extensions/logging'

import { ConfigRouter } from './routes/config/+router'
import { StorageServiceRouter } from './routes/storageservice/+router'
import { GamesRouter } from './routes/games/+router'
import { MsnRouter } from './routes/msn/+router'
import { AdminRouter } from './routes/admin/+router'
import { DebugRouter } from './routes/debug/+router'
import { AuthRouter } from './routes/auth/+router'

class TestHbs extends FlareController {
	@Get('/test')
	GetTestHbs(_: FlareRequest, response: FlareResponse) {
		response.render('test.hbs', { world: 'sSTINKY!' })
	}
}

export const webServer = async () => {
	const app = new FlareApp()
	const webPath = './src/www'

	app.useSettings('etag').set(false)
	app.useMiddlewares([cookieParser(), cors(), json(), urlencoded({ extended: false })])
	app.usePublic('/static', `${webPath}/public`)

	app.useViewEngine(
		'hbs',
		engine({
			extname: '.hbs',
			defaultLayout: false,
			partialsDir: `${webPath}/templates`,
		}),
		`${webPath}/templates`
	)

	app.useController(new TestHbs())
	app.useRouters([
		{ path: '/admin', router: AdminRouter },
		{ path: '/auth', router: AuthRouter },
		{ path: '/config', router: ConfigRouter },
		{ path: '/debug', router: DebugRouter },
		{ path: '/storageservice', router: StorageServiceRouter },
		{ path: '/games', router: GamesRouter },
		{ path: '/msn', router: MsnRouter },
	])

	app.build().listen(4200, () => logging.info('web server successfully initialized'))
}
