import cookieParser from 'cookie-parser'
import cors from 'cors'

import { FlareApp } from '../azureflare/app'
import { json, urlencoded } from 'express'
import { engine } from 'express-handlebars'
import { logging } from './extensions/logging'

import { Controller } from '../azureflare/core/controller'
import { Get } from '../azureflare/core/endpoint'
import { FlareRequest, FlareResponse } from '../azureflare/extension/types'
import { ConfigRouter } from './routes/config/+router'
import { StorageServiceRouter } from './routes/storageservice/+router'

class TestHbs extends Controller {
	@Get('/test')
	GetTestHbs(_: FlareRequest, response: FlareResponse) {
		response.render('test.hbs', { world: 'STINKY!' })
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
	])

	app.build().listen(4200, () => logging.info('web server successfully initialized'))
}
