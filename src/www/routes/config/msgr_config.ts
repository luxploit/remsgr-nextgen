import { Controller } from '../../../azureflare/core/controller'
import { Get, Post } from '../../../azureflare/core/endpoint'
import { FlareRequest, FlareResponse } from '../../../azureflare/extension/types'

import jsonConfig from '../../../../config.json'

export class MsgrConfigController extends Controller {
	@Post('/MsgrConfig.asmx')
	soapConfig(req: FlareRequest, res: FlareResponse) {
		res.renderXml!('config/soap_envelope.hbs', { viewHost: jsonConfig.server.host })
	}

	@Get('/MsgrConfig.asmx')
	xmlConfig(req: FlareRequest, res: FlareResponse) {
		res.renderXml!('config/partials/config.hbs', { host: jsonConfig.server.host })
	}
}
