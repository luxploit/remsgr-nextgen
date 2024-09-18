import { FlareExpressApp } from '../../../azureflare/extension/types'
import { createFlareRouter } from '../../../azureflare/router'
import { MsgrConfigController } from './msgr_config'

export const ConfigRouter = createFlareRouter((router) => {
	router.useController(new MsgrConfigController())
})
