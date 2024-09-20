import { FlareController, FlareRequest, FlareResponse, Patch } from '@lxpt/azureflare'

export class MaintenanceController extends FlareController {
	@Patch('/maintenance')
	schemaStore(req: FlareRequest, res: FlareResponse) {
		res.status(404).send()
	}
}
