import { createFlareRouter } from '@lxpt/azureflare'
import { TweenerController } from './tweener'

export const AuthRouter = createFlareRouter((router) => {
	router.useController(new TweenerController())
})
