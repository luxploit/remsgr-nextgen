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

class TestHbs extends FlareController {
	@Get('/test')
	GetTestHbs(_: FlareRequest, response: FlareResponse) {
		response.render('test.hbs', { world: 'sSTINKY!' })
	}
}

export const webServer = () => {
	const app = new FlareApp()

	app.useSettings('etag').set(false)
	app.useMiddlewares([cookieParser(), cors(), json(), urlencoded({ extended: false })])
	app.usePublic('/static', './src/www/public')

	app.useViewEngine(
		'hbs',
		engine({
			extname: '.hbs',
			defaultLayout: false,
			partialsDir: './src/www/templates',
		}),
		'./src/www/templates'
	)

	app.useController(new TestHbs())
	app.useRouters([
		{ path: '/Config', router: ConfigRouter },
		{ path: '/storageservice', router: StorageServiceRouter },
		{ path: '/games', router: GamesRouter },
		{ path: '/msn', router: MsnRouter },
	])

	app.build().listen(4200, () => logging.info('web server successfully initialized'))
}
