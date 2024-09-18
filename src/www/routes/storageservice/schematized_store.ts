import { Controller } from '../../../azureflare/core/controller'
import { Post } from '../../../azureflare/core/endpoint'
import { FlareRequest, FlareResponse } from '../../../azureflare/extension/types'

export class SchematizedStoreController extends Controller {
	@Post('/SchematizedStore.asmx')
	schemaStore(req: FlareRequest, res: FlareResponse) {
		res.status(404).send()
	}
}
