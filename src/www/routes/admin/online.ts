import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'

export class OnlineController extends FlareController {
	@Get('/online')
	schemaStore(req: FlareRequest, res: FlareResponse) {}
}
