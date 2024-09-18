import { FlareExpressApp } from '../../../azureflare/extension/types'
import { createFlareRouter } from '../../../azureflare/router'
import { SchematizedStoreController } from './schematized_store'

export const StorageServiceRouter = createFlareRouter((router) => {
	router.useController(new SchematizedStoreController())
})
