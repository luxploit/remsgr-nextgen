export enum OnlineStatus {
	Online = 'NLN',
	Busy = 'BSY',
	BeRightBack = 'BRB',
	Away = 'AWY',
	Idle = 'IDL',
	OnThePhone = 'PHN',
	OutToLunch = 'LUN',
	Hidden = 'HDN',
	Offline = 'FLN',
}

export type OnlineStatusT = `${OnlineStatus}`
