import { FlareController, FlareRequest, FlareResponse, Get } from '@lxpt/azureflare'
import { jsonConfig } from '../../../utils/config'

export class BannerAdsController extends FlareController {
	@Get('/bannersads')
	bannerAd(req: FlareRequest, res: FlareResponse) {
		if (!jsonConfig.ads.enabled) {
			return res.status(200).send()
		}

		const ad = jsonConfig.ads.ad_list[Math.floor(Math.random() * jsonConfig.ads.ad_list.length)]

		res.render('msn/bannerad.hbs', {
			host: jsonConfig.server.host,
			ad_url: ad.url,
			ad_img: ad.image,
		})
	}
}
