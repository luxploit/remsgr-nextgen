export type AuthMethodsT = 'CTP' | 'MD5' | 'TWN' | 'SSO' | 'SHA' | null
export const AuthMethods = {
	PlainText: 'CTP' as AuthMethodsT,
	SaltedMD5: 'MD5' as AuthMethodsT,
	Tweener: 'TWN' as AuthMethodsT,
	SingleSignOn: 'SSO' as AuthMethodsT,
	CircleTicket: 'SHA' as AuthMethodsT,
	Error: null,
}

export type AuthStagesT = 'I' | 'S' | 'A' | 'OK' | 'D' | null
export const AuthStages = {
	Input: 'I' as AuthStagesT,
	Salt: 'S' as AuthStagesT,
	Auth: 'A' as AuthStagesT, // circleTicket sha auth for MSNP17+
	OK: 'OK' as AuthStagesT,
	Disabled: 'D' as AuthStagesT,
	Error: null,
}

export enum UserProperties {
	PhoneHome = 'PHH',
	PhoneWork = 'PHW',
	PhoneMobile = 'PHM',
	ContactOnMobile = 'MOB',
	MobileEnabled = 'MBE',
	DirectPaging = 'WWE',
}
