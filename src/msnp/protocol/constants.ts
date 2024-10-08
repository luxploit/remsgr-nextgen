export const Commands = {
	Dispatch: {
		ProtocolVersion: 'VER',
		GetAuthProviderLegacy: 'INF',
		Authenticate: 'USR',
		ServerRedirect: 'XFR',
	},
	Synchronization: {
		BeginSynchronizationLegacy: 'SYN',
		FriendRequestPrivacy: 'GTC',
		InstantMessagesPrivacy: 'BLP',
	},
}

export const Errors = {
	InvalidSyntax: 200,
	InvalidParameter: 201,
	LegacyInvalidUser: 202,
	AlreadyLoggedIn: 207,
	InvalidUser: 208,
	UserAlreadyOnList: 215,
	UserNotOnList: 216,
	UserOffline: 217,
	TransferToSwitchboardFailed: 281,
	BadUserListFormat: 403,
	InternalServerError: 500,
	ServerIsBusy: 911,
	NotAllowedWhenHidden: 913,
}

export type AuthMethodsT = 'CTP' | 'MD5' | 'TWN' | 'SSO' | 'SHA' | null
export const AuthMethods = {
	PlainText: 'CTP' as AuthMethodsT,
	SaltedMD5: 'MD5' as AuthMethodsT,
	Tweener: 'TWN' as AuthMethodsT,
	SingleSignOn: 'SSO' as AuthMethodsT,
	CircleTicket: 'SHA' as AuthMethodsT,
	Error: null,
}

export type AuthStagesT = 'I' | 'S' | 'A' | 'OK' | null
export const AuthStages = {
	Input: 'I' as AuthStagesT,
	Salt: 'S' as AuthStagesT,
	Auth: 'A' as AuthStagesT, // circleTicket sha auth for MSNP17+
	OK: 'OK' as AuthStagesT,
	Error: null,
}
