import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'

export class TweenerController extends FlareController {
	@Get('/tweener')
	tweenerAuth(req: FlareRequest, res: FlareResponse) {}
}
