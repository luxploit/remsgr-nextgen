import { Controller } from '../../../azureflare/core/controller'
import { Get } from '../../../azureflare/core/endpoint'
import { FlareRequest, FlareResponse } from '../../../azureflare/extension/types'

import jsonConfig from '../../../../config.json'

export class BannerAdsController extends Controller {
	@Get('/bannersads')
	bannerAd(req: FlareRequest, res: FlareResponse) {
		if (!jsonConfig.ads.enabled) {
			return res.status(200).send()
		}

		const ad = jsonConfig.ads.ad_list[Math.floor(Math.random() * jsonConfig.ads.ad_list.length)]

		res.renderXml!('msn/bannerad.hbs', { ad_url: ad.url, ad_img: ad.image })
	}
}
