export enum DispatchCmds {
	ProtocolVersion = 'VER',
	GetAuthProviderLegacy = 'INF',
	Authenticate = 'USR',
	ServerRedirect = 'XFR',
}

export enum SyncCmds {
	BeginSynchronizationLegacy = 'SYN',
	FriendRequestPrivacy = 'GTC',
	InstantMessagesPrivacy = 'BLP',
	UserProperties = 'PRP',
	ContactProperties = 'BRP',
	ListGroups = 'LSG',
	ListContacts = 'LST',
}
