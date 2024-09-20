import { createFlareRouter } from '@lxpt/azureflare'
import { BannerAdsController } from './banner_ads'

export const MsnRouter = createFlareRouter((router) => {
	router.useController(new BannerAdsController())
})
