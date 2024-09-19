import { createFlareRouter } from '../../../azureflare/router'
import { SecretTokenAuthorization } from './+auth_provider'
import { OnlineController } from './online'

export const AdminRouter = createFlareRouter((router) => {
	router.useAuthorization(new SecretTokenAuthorization())

	router.useControllers([new OnlineController()])
})
