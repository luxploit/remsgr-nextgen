import { Post, FlareRequest, FlareResponse, Get, FlareController } from '@lxpt/azureflare'
import { jsonConfig } from '../../../utils/config'

export class MsgrConfigController extends FlareController {
	@Post('/MsgrConfig.asmx')
	soapConfig(req: FlareRequest, res: FlareResponse) {
		res.renderXml!('config/soap_envelope.hbs', { viewHost: jsonConfig.server.host })
	}

	@Get('/MsgrConfig.asmx')
	xmlConfig(req: FlareRequest, res: FlareResponse) {
		res.renderXml!('config/msgr_config.hbs', { host: jsonConfig.server.host })
	}
}
