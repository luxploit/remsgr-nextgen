import { FlareController, FlareRequest, FlareResponse, Patch } from '@lxpt/azureflare'

export class MaintenanceController extends FlareController {
	@Patch('/maintenance')
	sendMaintenance(req: FlareRequest, res: FlareResponse) {
		const time = parseInt(req.query['t'] as string, 10)
	}
}
