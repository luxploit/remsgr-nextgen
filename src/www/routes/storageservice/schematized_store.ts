import { FlareController, FlareRequest, FlareResponse, Post } from '@lxpt/azureflare'

export class SchematizedStoreController extends FlareController {
	@Post('/SchematizedStore.asmx')
	schemaStore(req: FlareRequest, res: FlareResponse) {
		res.status(404).send()
	}
}
