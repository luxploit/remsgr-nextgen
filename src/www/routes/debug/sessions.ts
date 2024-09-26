import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'

export class ListSessionsController extends FlareController {
	@Get('/sessions')
	bannerAd(req: FlareRequest, res: FlareResponse) {}
}
