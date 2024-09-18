import 'reflect-metadata'

const policyKey = Symbol('policy')

export const Policy = (policy: Function): MethodDecorator & ClassDecorator => {
	return (target: any, propertyKey?: string | symbol) => {
		if (propertyKey) {
			Reflect.defineMetadata(policyKey, policy, target, propertyKey)
		} else {
			Reflect.defineMetadata(policyKey, policy, target)
		}
	}
}

export const getPolicies = (target: any, propertyKey?: string | symbol): Function[] => {
	if (propertyKey) {
		return Reflect.getMetadata(policyKey, target, propertyKey) || []
	} else {
		return Reflect.getMetadata(policyKey, target) || []
	}
}
