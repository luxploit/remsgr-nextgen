import {
	createFlareRouter,
	FlareHttpError,
	FlareNext,
	FlareRequest,
	FlareResponse,
} from '@lxpt/azureflare'
import { ListSessionsController } from './sessions'
import { ListChatsController } from './chats'
import { cliArgs } from '../../../utils/config'

export const DebugRouter = createFlareRouter((router) => {
	router.useMiddleware((req: FlareRequest, res: FlareResponse, next: FlareNext) => {
		if (!cliArgs.dev) {
			return FlareHttpError(res, 400, 'Stop snooping around :(')

			//replace with
			// res.error(400, "stop snooping around :(") in flare v0.2.0
		}

		next()
	})

	router.useControllers([new ListSessionsController(), new ListChatsController()])
})
