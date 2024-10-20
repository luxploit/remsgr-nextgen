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
	UserPropertiesLegacy = 'PRP',
	ContactPropertiesLegacy = 'BRP',
	ListGroupsLegacy = 'LSG',
	ListContactsLegacy = 'LST',
}

export enum PresenceCmds {
	ClientVersionRecord = 'CVR',
	ClientVersionQuery = 'CVQ',
	ChangeStatus = 'CHG',
	InitialStatus = 'ILN',
	OnlineStatus = 'NLN',
	OfflineStatus = 'FLN',
	GetExtendedStatus = 'UBX',
	SetExtendedStatus = 'UUX',
	RenameFriendlyLegacy = 'REA',
}

export enum MiscCmds {
	PolicyConfiguration = 'GCF',
	ServerNotification = 'NOT',
	NetworkLinks = 'URL',
}

export enum UserCmds {
	AddToListLegacy = 'ADD',
	AddContactLegacy = 'ADC',
}
