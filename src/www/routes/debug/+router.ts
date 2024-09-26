import {
	createFlareRouter,
	FlareHttpError,
	FlareNext,
	FlareRequest,
	FlareResponse,
} from '@lxpt/azureflare'
import { ListSessionsController } from './sessions'
import { isDebug } from '../../../utils/config'
import { ListChatsController } from './chats'

export const DebugRouter = createFlareRouter((router) => {
	router.useMiddleware((req: FlareRequest, res: FlareResponse, next: FlareNext) => {
		if (!isDebug) {
			return FlareHttpError(res, 400, 'Stop snooping around :(')

			//replace with
			// res.error(400, "stop snooping around :(") in flare v0.2.0
		}

		next()
	})

	router.useControllers([new ListSessionsController(), new ListChatsController()])
})
