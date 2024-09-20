import { createFlareRouter, FlareSecretTokenAuthorization } from '@lxpt/azureflare'
import { OnlineController } from './online'
import { jsonConfig } from '../../../utils/config'

export const AdminRouter = createFlareRouter((router) => {
	router.useAuthorization(
		new FlareSecretTokenAuthorization({
			header: 'x-secret-token',
			token: jsonConfig.server.secret,
		})
	)

	router.useControllers([new OnlineController()])
})
