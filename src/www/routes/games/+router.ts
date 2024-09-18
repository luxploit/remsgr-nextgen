import { FlareExpressApp } from '../../../azureflare/extension/types'
import { createFlareRouter } from '../../../azureflare/router'
import { GamesListController } from './list'

export const GamesRouter = createFlareRouter((router) => {
	router.useController(new GamesListController())
})
