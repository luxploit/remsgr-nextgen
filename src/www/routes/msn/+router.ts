import { FlareExpressApp } from '../../../azureflare/extension/types'
import { createFlareRouter } from '../../../azureflare/router'
import { BannerAdsController } from './banner_ads'

export const MsnRouter = createFlareRouter((router) => {
	router.useController(new BannerAdsController())
})
