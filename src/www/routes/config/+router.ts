import { createFlareRouter } from '@lxpt/azureflare'
import { MsgrConfigController } from './msgr_config'

export const ConfigRouter = createFlareRouter((router) => {
	router.useController(new MsgrConfigController())
})
