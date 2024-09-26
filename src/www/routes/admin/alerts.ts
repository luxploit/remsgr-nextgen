import { FlareController, FlareRequest, FlareResponse, Patch } from '@lxpt/azureflare'

interface AlertRequest {
	message: string
	link?: string
}

export class MaintenanceController extends FlareController {
	@Patch('/alerts')
	sendAlert(req: FlareRequest, res: FlareResponse) {
		const { message, link } = req.body as AlertRequest
	}
}
