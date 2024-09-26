import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'

export class ListChatsController extends FlareController {
	@Get('/chats')
	bannerAd(req: FlareRequest, res: FlareResponse) {}
}
