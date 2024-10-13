import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'

export class ListChatsController extends FlareController {
	@Get('/chats')
	listChats(req: FlareRequest, res: FlareResponse) {}
}
