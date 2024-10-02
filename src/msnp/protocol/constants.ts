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

export const AuthStages = {
	Input: 'I',
	Salt: 'S',
	Auth: 'A', // circleTicket auth for MSNP17+
}
