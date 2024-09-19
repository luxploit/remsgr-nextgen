import { Controller } from '../../../azureflare/core/controller'
import { Get } from '../../../azureflare/core/endpoint'
import { FlareRequest, FlareResponse } from '../../../azureflare/extension/types'

export class OnlineController extends Controller {
	@Get('/online')
	schemaStore(req: FlareRequest, res: FlareResponse) {}
}
