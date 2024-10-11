export enum Properties {
	PhoneHome = 'PHH',
	PhoneWork = 'PHW',
	PhoneMobile = 'PHM',
	ContactOnMobile = 'MOB',
	MobileEnabled = 'MBE',
	DirectPaging = 'WWE',
	FriendlyName = 'MFN',
	HasBlog = 'HSB',
}

export type PropertiesT = `${Properties}`

export enum ListTypes {
	Forward = 'FL',
	Allow = 'AL',
	Block = 'BL',
	Reverse = 'RL',
}

export type ListTypesT = `${ListTypes}`

export enum ListBitFlags {
	Forward = 1 << 0,
	Allow = 1 << 1,
	Block = 1 << 2,
	Reverse = 1 << 3,
	Pending = 1 << 4, // Unused
}

export enum ContactType {
	MSN = 1 << 0,
	Lync = 1 << 1, // AKA: LCS/OCS/Skype for Business
	Telephone = 1 << 2,
	MobileNetwork = 1 << 3, // MNI used by Vodafone interop
	Jaguire = 1 << 4, // used by Japanese mobile interop
	Yahoo = 1 << 5, // Yahoo Interop
}
