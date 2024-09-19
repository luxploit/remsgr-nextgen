import { Controller } from '../../../azureflare/core/controller'
import { Patch } from '../../../azureflare/core/endpoint'
import { FlareRequest, FlareResponse } from '../../../azureflare/extension/types'

export class MaintenanceController extends Controller {
	@Patch('/maintenance')
	schemaStore(req: FlareRequest, res: FlareResponse) {
		res.status(404).send()
	}
}
