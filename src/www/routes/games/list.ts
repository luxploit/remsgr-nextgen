import { Controller } from '../../../azureflare/core/controller'
import { Post } from '../../../azureflare/core/endpoint'
import { FlareRequest, FlareResponse } from '../../../azureflare/extension/types'

export class GamesListController extends Controller {
	@Post('/list')
	gamesList(req: FlareRequest, res: FlareResponse) {
		res.send('Games are not currently supported.')
	}
}
