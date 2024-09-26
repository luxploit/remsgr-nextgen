import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'

export class OnlineController extends FlareController {
	@Get('/online')
	onlineUsers(req: FlareRequest, res: FlareResponse) {}
}
