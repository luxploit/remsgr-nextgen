import { AuthorizationProvider } from '../../../azureflare/authorization/provider'
import { FlareRequest, FlareResponse, FlareNext } from '../../../azureflare/extension/types'
import { timingSafeStringCompare, FlareHttpError } from '../../../azureflare/util'
import { jsonConfig } from '../../../utils/config'

export class SecretTokenAuthorization extends AuthorizationProvider {
	constructor() {
		super()

		this.authorize = this.authorize.bind(this)
	}

	authorize = (request: FlareRequest, response: FlareResponse, next: FlareNext) => {
		const isValid = (secret: string) => {
			return timingSafeStringCompare(jsonConfig.server.secret, secret)
		}

		const authHeader = request.get('Authorization')

		if (!authHeader) {
			return FlareHttpError(response, 401, 'Authorization Required!')
		}

		if (!isValid(authHeader)) {
			return FlareHttpError(response, 401, 'Authorization Failed!')
		}

		return next()
	}
}
