import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'

export class GamesListController extends FlareController {
	@Get('/list')
	gamesList(req: FlareRequest, res: FlareResponse) {
		res.send('Games are not currently supported.')
	}
}
