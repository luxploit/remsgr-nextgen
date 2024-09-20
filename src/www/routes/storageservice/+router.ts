import { FlareExpressApp, createFlareRouter } from '@lxpt/azureflare'
import { SchematizedStoreController } from './schematized_store'

export const StorageServiceRouter = createFlareRouter((router) => {
	router.useController(new SchematizedStoreController())
})
