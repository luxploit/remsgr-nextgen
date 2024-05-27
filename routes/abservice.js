const express = require("express");
const router = express.Router();

router.post("/SharingService.asmx", (req, res) => {
	// const date = getSortaISODate();
	return res.status(200).send(`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
	<soap:Header>
		<ServiceHeader xmlns="http://www.msn.com/webservices/AddressBook">
			<Version>15.01.1408.0000</Version>
			<CacheKey>12r1:iAX_-5cZAMYBiZtBq5iO1WhrC_HVMfx65jPtvaCVa-YcW1mZDrhDAZjbQlDMXnWqqq6fNuQ8Q8LCJbnj1LVUDEpsxtkKDOhwwXeHbXDGe4IPyR18ek-aOhH28WfUbR3vCV39yTlnNak8mf5BszNUhwqs_HsFB5Uz5Rsx10OSeLgAOD9Ct26dFjuYsHz3GCRITDCjdmmZhiH7d6YzusCBKB9h-LBiuu92ucpsPQ</CacheKey>
			<CacheKeyChanged>true</CacheKeyChanged>
			<PreferredHostName>localhost</PreferredHostName>
			<SessionId>8bda4309-3e18-426d-9577-50f30974d79b</SessionId>
		</ServiceHeader>
	</soap:Header>
	<soap:Body>
		<FindMembershipResponse xmlns="http://www.msn.com/webservices/AddressBook">
			<FindMembershipResult>
				<Services>
					<Service>
						<Memberships><Membership>
									<MemberRole>Allow</MemberRole>
									<Members><Member xsi:type="PassportMember">
													<MembershipId>Allow/aa1888d5-0df9-4388-b264-8d8befac2421</MembershipId>
													<Type>Passport</Type>
													<State>Accepted</State>
													<Deleted>false</Deleted>
													<LastChanged>2024-02-01T19:14:18Z</LastChanged>
													<JoinedDate>2023-08-21T15:58:33Z</JoinedDate>
													<ExpirationDate>0001-01-01T00:00:00</ExpirationDate>
													<Changes />
													<PassportName>nullptralt@escargot.chat</PassportName>
													<IsPassportNameHidden>false</IsPassportNameHidden>
													<PassportId>0</PassportId>
													<CID>2388223847251666098</CID>
													<PassportChanges />
													<LookedupByCID>false</LookedupByCID>
												</Member></Members>
									<MembershipIsComplete>true</MembershipIsComplete>
								</Membership><Membership>
									<MemberRole>Block</MemberRole>
									<Members></Members>
									<MembershipIsComplete>true</MembershipIsComplete>
								</Membership><Membership>
									<MemberRole>Reverse</MemberRole>
									<Members><Member xsi:type="PassportMember">
													<MembershipId>Reverse/aa1888d5-0df9-4388-b264-8d8befac2421</MembershipId>
													<Type>Passport</Type>
													<State>Accepted</State>
													<Deleted>false</Deleted>
													<LastChanged>2024-02-01T19:14:18Z</LastChanged>
													<JoinedDate>2023-08-21T15:58:33Z</JoinedDate>
													<ExpirationDate>0001-01-01T00:00:00</ExpirationDate>
													<Changes />
													<PassportName>nullptralt@escargot.chat</PassportName>
													<IsPassportNameHidden>false</IsPassportNameHidden>
													<PassportId>0</PassportId>
													<CID>2388223847251666098</CID>
													<PassportChanges />
													<LookedupByCID>false</LookedupByCID>
												</Member></Members>
									<MembershipIsComplete>true</MembershipIsComplete>
								</Membership><Membership>
								<MemberRole>Pending</MemberRole>
								<Members></Members>
								<MembershipIsComplete>true</MembershipIsComplete>
							</Membership>
						</Memberships>
						<Info>
							<Handle>
								<Id>1</Id>
								<Type>Messenger</Type>
								<ForeignId />
							</Handle>
							<InverseRequired>false</InverseRequired>
							<AuthorizationCriteria>Everyone</AuthorizationCriteria>
							<IsBot>false</IsBot>
						</Info>
						<Changes />
						<LastChange>2024-02-01T19:14:18Z</LastChange>
						<Deleted>false</Deleted>
					</Service>
				</Services>
				<OwnerNamespace>
					<Info>
						<Handle>
							<Id>00000000-0000-0000-0000-000000000000</Id>
							<IsPassportNameHidden>false</IsPassportNameHidden>
							<CID>0</CID>
						</Handle>
						<CreatorPuid>0</CreatorPuid>
						<CreatorCID>-307206720018089283</CreatorCID>
						<CreatorPassportName>nullptralt@escargot.chat</CreatorPassportName>
						<CircleAttributes>
							<IsPresenceEnabled>false</IsPresenceEnabled>
							<Domain>WindowsLive</Domain>
						</CircleAttributes>
						<MessengerApplicationServiceCreated>false</MessengerApplicationServiceCreated>
					</Info>
					<Changes />
					<CreateDate>2024-02-01T19:14:18Z</CreateDate>
					<LastChange>2024-02-01T19:14:18Z</LastChange>
				</OwnerNamespace>
			</FindMembershipResult>
		</FindMembershipResponse>
	</soap:Body>
</soap:Envelope>`);
});

router.post("/abservice.asmx", (req, res) => {
	return res.status(200).send(`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
	<soap:Header>
		<ServiceHeader xmlns="http://www.msn.com/webservices/AddressBook">
			<Version>15.01.1408.0000</Version>
			<CacheKey>12r1:PvYuZs8y_W3ejO4_87AYpKuS9rmo-oCI1TdZctjVjubfQemm5rRJfmT01v5w8m89quPXyOgFmG1W2sNmd6NQjw0SCFFI6DbErRlt1eg4plJJJ8skad6BvTvMNDW_ILDxirLfczxLm-NM1byYDN8U-c06xTnAjouILXXMfZgphLeZQOa-kApE09lbcucxp393gVtU0AxGK6dIRweo7xxw5TGUhbOA3VLECt1Odw</CacheKey>
			<CacheKeyChanged>true</CacheKeyChanged>
			<PreferredHostName>localhost</PreferredHostName>
			<SessionId>15f5a0d9-3687-4d9c-8b53-3bfee7b01933</SessionId>
		</ServiceHeader>
	</soap:Header>
	<soap:Body>
		<ABFindContactsPagedResponse xmlns="http://www.msn.com/webservices/AddressBook">
			<ABFindContactsPagedResult><Groups>
						
							<Group>
		<groupId>780dd9ab-6810-49c2-a04d-124665651c03</groupId>
		<groupInfo>
			<annotations>
				<Annotation>
					<Name>MSN.IM.Display</Name>
					<Value>1</Value>
				</Annotation>
			</annotations>
			<groupType>c8529ce2-6ead-434d-881f-341e17db3ff8</groupType>
			<name>Favorites</name>
			<IsNotMobileVisible>false</IsNotMobileVisible>
			<IsPrivate>false</IsPrivate>
			<IsFavorite>true</IsFavorite>
		</groupInfo>
		<propertiesChanged />
		<fDeleted>false</fDeleted>
		<lastChange>2024-02-01T19:14:19Z</lastChange>
	</Group>
						
					</Groups><Contacts><Contact>
								<contactId>b67ff5eb-eabf-4471-bd7a-b5a41d95bcfb</contactId>
	<contactInfo><contactType>Regular</contactType>
		<quickName>nullptralt@escargot.chat</quickName><passportName>nullptralt@escargot.chat</passportName>
		<IsPassportNameHidden>false</IsPassportNameHidden>
		<displayName>nullptralt@escargot.chat</displayName>
		<puid>0</puid><CID>-307206720018089283</CID>
		<IsNotMobileVisible>false</IsNotMobileVisible>
		<isMobileIMEnabled>false</isMobileIMEnabled>
		<isMessengerUser>true</isMessengerUser>
		<isFavorite>false</isFavorite>
		<isSmtp>false</isSmtp>
		<hasSpace>false</hasSpace>
		<spotWatchState>NoDevice</spotWatchState>
		<birthdate>0001-01-01T00:00:00</birthdate><primaryEmailType>ContactEmailPersonal</primaryEmailType>
		<PrimaryLocation>ContactLocationPersonal</PrimaryLocation>
		<PrimaryPhone>ContactPhonePersonal</PrimaryPhone>
		<IsPrivate>false</IsPrivate>
		<Gender>Unspecified</Gender>
		<TimeZone>None</TimeZone>
	</contactInfo>
	<propertiesChanged />
	<fDeleted>false</fDeleted>
	<lastChange>2024-02-01T19:14:19Z</lastChange>
								</Contact><Contact>
								<contactId>aa1888d5-0df9-4388-b264-8d8befac2421</contactId>
	<contactInfo><contactType>Regular</contactType>
		<quickName>nullptr</quickName><passportName>nullptralt@escargot.chat</passportName>
		<IsPassportNameHidden>false</IsPassportNameHidden>
		<displayName>nullptr</displayName>
		<puid>0</puid><CID>2388223847251666098</CID>
		<IsNotMobileVisible>false</IsNotMobileVisible>
		<isMobileIMEnabled>false</isMobileIMEnabled>
		<isMessengerUser>true</isMessengerUser>
		<isFavorite>false</isFavorite>
		<isSmtp>false</isSmtp>
		<hasSpace>false</hasSpace>
		<spotWatchState>NoDevice</spotWatchState>
		<birthdate>0001-01-01T00:00:00</birthdate><primaryEmailType>ContactEmailPersonal</primaryEmailType>
		<PrimaryLocation>ContactLocationPersonal</PrimaryLocation>
		<PrimaryPhone>ContactPhonePersonal</PrimaryPhone>
		<IsPrivate>false</IsPrivate>
		<Gender>Unspecified</Gender>
		<TimeZone>None</TimeZone>
	</contactInfo>
	<propertiesChanged />
	<fDeleted>false</fDeleted>
	<lastChange>2024-02-01T19:14:19Z</lastChange>
								</Contact><Contact>
		<contactId>b67ff5eb-eabf-4471-bd7a-b5a41d95bcfb</contactId>
		<contactInfo>
			<annotations>
				<Annotation>
					<Name>MSN.IM.MBEA</Name>
					<Value>0</Value>
				</Annotation>
				<Annotation>
					<Name>MSN.IM.GTC</Name>
					<Value>0</Value>
				</Annotation>
				<Annotation>
					<Name>MSN.IM.BLP</Name>
					<Value>1</Value>
				</Annotation></annotations>
			<contactType>Me</contactType>
			<quickName>nullptralt@escargot.chat</quickName>
			<passportName>nullptralt@escargot.chat</passportName>
			<IsPassportNameHidden>false</IsPassportNameHidden>
			<displayName>nullptralt@escargot.chat</displayName>
			<puid>0</puid>
			<CID>-307206720018089283</CID>
			<IsNotMobileVisible>false</IsNotMobileVisible>
			<isMobileIMEnabled>false</isMobileIMEnabled>
			<isMessengerUser>false</isMessengerUser>
			<isFavorite>false</isFavorite>
			<isSmtp>false</isSmtp>
			<hasSpace>false</hasSpace>
			<spotWatchState>NoDevice</spotWatchState>
			<birthdate>0001-01-01T00:00:00</birthdate>
			<primaryEmailType>ContactEmailPersonal</primaryEmailType>
			<PrimaryLocation>ContactLocationPersonal</PrimaryLocation>
			<PrimaryPhone>ContactPhonePersonal</PrimaryPhone>
			<IsPrivate>false</IsPrivate>
			<Gender>Unspecified</Gender>
			<TimeZone>None</TimeZone>
		</contactInfo>
		<propertiesChanged />
		<fDeleted>false</fDeleted>
		<lastChange>2024-02-01T19:14:19Z</lastChange>
	</Contact></Contacts><CircleResult><CircleTicket>&lt;?xml version="1.0" encoding="utf-16"?&gt;&lt;SignedTicket xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ver="1" keyVer="1"&gt;&lt;Data&gt;PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTE2Ij8+DQo8VGlja2V0IHhtbG5zOnhzaT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEtaW5zdGFuY2UiIHhtbG5zOnhzZD0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEiPg0KICA8VFM+MDAwMC0wMS0wMVQwMDowMDowMDwvVFM+DQogIDxDSUQ+LTMwNzIwNjcyMDAxODA4OTI4MzwvQ0lEPg0KPC9UaWNrZXQ+&lt;/Data&gt;&lt;Sig&gt;oOU1BOcY0RSObyvDaXOMi/IOUHxPvR/orN4p7ZDZZdygbgM8L+E49rGNWPhoZXd7JwSPlFjiNVK0ixNraPhz7p59mUdZKJpyXhZ1LTKtbp5j5j/aMKahu5SrQsTucqfPRdqOa4GVaZsnKU02vZ1ZsfJ/tkGWyV2/IosP/HX0sAe/mbgJZ2CU+xlfKWuKZZzgXAg7BpBX766Y16fFtWaJILoZPdsJfXQN5Nh4y97WEIHP/SnNAzcK4FGceXRSgOS1CrIpZiM9W986jWAneaBPb5M74kBxL7cmqO31xO5H1JHMkDLNGoRiQz2nFaRT+H1aOpk/kBo7OXJN5tDkaKSghA==&lt;/Sig&gt;&lt;/SignedTicket&gt;</CircleTicket>
					</CircleResult><Ab>
					<abId>00000000-0000-0000-0000-000000000000</abId>
					<abInfo>
						<ownerPuid>0</ownerPuid>
						<OwnerCID>-307206720018089283</OwnerCID>
						<ownerEmail>nullptralt@escargot.chat</ownerEmail>
						<fDefault>true</fDefault>
						<joinedNamespace>false</joinedNamespace>
						<IsBot>false</IsBot>
						<IsParentManaged>false</IsParentManaged>
						<AccountTierLastChanged>0001-01-01T00:00:00</AccountTierLastChanged>
						<ProfileVersion>0</ProfileVersion>
						<SubscribeExternalPartner>false</SubscribeExternalPartner>
						<NotifyExternalPartner>false</NotifyExternalPartner>
						<AddressBookType>Individual</AddressBookType>
					</abInfo>
					<lastChange>2024-02-01T19:14:19Z</lastChange>
					<DynamicItemLastChanged>0001-01-01T00:00:00</DynamicItemLastChanged>
					<createDate>2023-10-08T15:10:37Z</createDate>
					<propertiesChanged />
				</Ab>
			</ABFindContactsPagedResult>
		</ABFindContactsPagedResponse>
	</soap:Body>
</soap:Envelope>`);
});


module.exports = router;