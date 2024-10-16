export type AuthMethodsT = (typeof AuthMethods)[keyof typeof AuthMethods]
export const AuthMethods = {
	PlainText: 'CTP',
	SaltedMD5: 'MD5',
	Tweener: 'TWN',
	SingleSignOn: 'SSO',
	CircleTicket: 'SHA',
	MetroWeb: 'WEB',
	Error: null,
} as const

export type AuthStagesT = (typeof AuthStages)[keyof typeof AuthStages]
export const AuthStages = {
	Initial: 'I',
	Subsequent: 'S',
	Auth: 'A', // circleTicket sha auth for MSNP17+
	OK: 'OK',
	Disabled: 'D',
	Error: null,
} as const
