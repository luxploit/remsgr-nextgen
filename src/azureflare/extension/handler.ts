import { FlareNext, FlareRequest, FlareResponse } from './types'

export const RegisterExpressExtensions = (
	request: FlareRequest,
	response: FlareResponse,
	next: FlareNext
) => {
	response.xml = (body: any) => {
		response.set('Content-Type', 'text/xml')
		response.send(body)
		return response
	}

	response.renderXml = (template: string, data?: Object) => {
		response.set('Content-Type', 'text/xml')
		response.render(template, data)
		return response
	}

	next()
}
