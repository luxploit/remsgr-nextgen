import { createFlareRouter } from '@lxpt/azureflare'
import { GamesListController } from './list'

export const GamesRouter = createFlareRouter((router) => {
	router.useController(new GamesListController())
})
