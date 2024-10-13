export enum DispatchCmds {
	ProtocolVersion = 'VER',
	GetAuthProviderLegacy = 'INF',
	Authenticate = 'USR',
	ServerRedirect = 'XFR',
	SignOut = 'OUT',
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

export enum PresenceCmds {
	ClientVersionRecord = 'CVR',
	ClientVersionQuery = 'CVQ',
	ChangeStatus = 'CHG',
	InitialStatus = 'ILN',
	GetExtendedStatus = 'UBX',
	SetExtendedstatus = 'UUX',
}

export enum MiscCmds {
	PolicyConfiguration = 'GCF',
}
