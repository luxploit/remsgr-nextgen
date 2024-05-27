const express = require("express");
const router = express.Router();

router.post("/SharingService.asmx", (req, res) => {
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader("Server", "Windows 95");
    res.setHeader("Access-Control-Expose-Headers", "Authentication-Info,X-MSN-Messenger");
    res.removeHeader("Keep-Alive");

    const deltasOnly = req.body["soap:Envelope"]["soap:Body"]["FindMembership"]["deltasOnly"];
    if (!deltasOnly) {
        res.send(`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"> 
        <soap:Body> 
            <soap:Fault> 
                <faultcode>soap:Client</faultcode> 
                <faultstring>Full sync required.  Details: Delta syncs disabled.</faultstring> 
                <faultactor>http://www.msn.com/webservices/AddressBook/FindMembership</faultactor> 
                <detail> 
                    <errorcode xmlns="http://www.msn.com/webservices/AddressBook">FullSyncRequired</errorcode> 
                    <errorstring xmlns="http://www.msn.com/webservices/AddressBook">Full sync required.  Details: Delta syncs disabled.</errorstring> 
                    <machineName xmlns="http://www.msn.com/webservices/AddressBook">DM2CDP1012622</machineName> 
                    <additionalDetails> 
                        <originalExceptionErrorMessage>Full sync required.  Details: Delta syncs disabled.</originalExceptionErrorMessage> 
                    </additionalDetails> 
                </detail> 
            </soap:Fault> 
        </soap:Body> 
    </soap:Envelope>`)
    } else {
        res.send(`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"> 
        <soap:Header> 
            <ServiceHeader xmlns="http://www.msn.com/webservices/AddressBook"> 
                <Version>15.01.1408.0000</Version> 
                <CacheKey>12r1:oDpk0qA55oNmtWa9sa4utusFGKhVQiFGyMpk2Y0zlVpwlSfFe_Arr9ObmzmnYsB65FhmiTPPi_aaZWL3H5BSEmc7kDlAcpu1pVV5zkFlqoroduLxB_8O2tEwhgGiq4wBEq4bVvsB-hLdGkroMOSal82JrNd53pP80BFl4DExBdxvWp-0w1qF9_WeIHfXClpYJZbo2L-5Y6Uk4jAjnm-NCll6ruG0WZkUQ3CjVg</CacheKey> 
                <CacheKeyChanged>true</CacheKeyChanged> 
                <PreferredHostName>192.168.1.62</PreferredHostName> 
                <SessionId>67b24ee0-ab46-4bf7-8816-b52620d50028</SessionId> 
            </ServiceHeader> 
        </soap:Header> 
        <soap:Body> 
            <FindMembershipResponse xmlns="http://www.msn.com/webservices/AddressBook"> 
                <FindMembershipResult> 
                    <Services> 
                        <Service> 
                            <Memberships>
                                <Membership> 
                                    <MemberRole>Allow</MemberRole> 
                                    <Members />
                                    <MembershipIsComplete>true</MembershipIsComplete> 
                                </Membership>
                                <Membership> 
                                    <MemberRole>Block</MemberRole> 
                                    <Members /> 
                                    <MembershipIsComplete>true</MembershipIsComplete> 
                                </Membership>
                                <Membership> 
                                    <MemberRole>Reverse</MemberRole> 
                                    <Members />
                                    <MembershipIsComplete>true</MembershipIsComplete> 
                                </Membership>
                                <Membership> 
                                    <MemberRole>Pending</MemberRole> 
                                    <Members /> 
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
                            <LastChange>2024-05-27T13:36:38Z</LastChange> 
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
                            <CreatorCID>0</CreatorCID> 
                            <CreatorPassportName>fergalicious@twink.com</CreatorPassportName> 
                            <CircleAttributes> 
                                <IsPresenceEnabled>false</IsPresenceEnabled> 
                                <Domain>WindowsLive</Domain> 
                            </CircleAttributes> 
                            <MessengerApplicationServiceCreated>false</MessengerApplicationServiceCreated> 
                        </Info> 
                        <Changes /> 
                        <CreateDate>2024-05-27T13:36:38Z</CreateDate> 
                        <LastChange>2024-05-27T13:36:38Z</LastChange> 
                    </OwnerNamespace> 
                </FindMembershipResult> 
            </FindMembershipResponse> 
        </soap:Body> 
    </soap:Envelope>`);
    }
});

router.post("/abservice.asmx", (req, res) => {
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader("Server", "Windows 95");
    res.setHeader("Access-Control-Expose-Headers", "Authentication-Info,X-MSN-Messenger");
    res.removeHeader("Keep-Alive");

    const deltasOnly = req.body["soap:Envelope"]["soap:Body"]["ABFindContactsPaged"]["filterOptions"]["DeltasOnly"];
    if (deltasOnly) {
        res.send(`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"> 
        <soap:Body> 
            <soap:Fault> 
                <faultcode>soap:Client</faultcode> 
                <faultstring>Full sync required.  Details: Delta syncs disabled.</faultstring> 
                <faultactor>http://www.msn.com/webservices/AddressBook/FindMembership</faultactor> 
                <detail> 
                    <errorcode xmlns="http://www.msn.com/webservices/AddressBook">FullSyncRequired</errorcode> 
                    <errorstring xmlns="http://www.msn.com/webservices/AddressBook">Full sync required.  Details: Delta syncs disabled.</errorstring> 
                    <machineName xmlns="http://www.msn.com/webservices/AddressBook">DM2CDP1012622</machineName> 
                    <additionalDetails> 
                        <originalExceptionErrorMessage>Full sync required.  Details: Delta syncs disabled.</originalExceptionErrorMessage> 
                    </additionalDetails> 
                </detail> 
            </soap:Fault> 
        </soap:Body> 
    </soap:Envelope>`)
    } else {
    res.send(`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"> 
	<soap:Header> 
		<ServiceHeader xmlns="http://www.msn.com/webservices/AddressBook"> 
			<Version>15.01.1408.0000</Version> 
			<CacheKey>12r1:4GP01drPyaBaTLIC_yywIBTadPEb-LsvcoudoYCw4Tbmj7wDVU4u-_V4PABhOm7kE7FmXBe-CqyQmAyxZZRMNgG1J6paPBW5AFpbaJw_PTvepr_wmhDiQUBg1U55UnBZ_CK9Z_SoG9YHY1TS6uS51pS8lGe32xql27JiBmEZ7NcHsT7EWNbTpYQXq2Dj_FwAC6HF3jaOcHCYp8Upr-DhkaOtk5MKoPKPuhHl_w</CacheKey> 
			<CacheKeyChanged>true</CacheKeyChanged> 
			<PreferredHostName>192.168.1.62</PreferredHostName> 
			<SessionId>10bb6747-dceb-4624-8617-a3624b80a491</SessionId> 
		</ServiceHeader> 
	</soap:Header> 
	<soap:Body> 
		<ABFindContactsPagedResponse xmlns="http://www.msn.com/webservices/AddressBook"> 
			<ABFindContactsPagedResult>
				<Groups> 
					<Group> 
						<groupId>00000000-0000-0000-0000-000000000000</groupId> 
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
						<lastChange>2024-05-27T13:36:38Z</lastChange> 
					</Group> 
				</Groups>
				<Contacts>
					<Contact> 
						<contactId>00000000-0000-0000-0000-000000000000</contactId> 
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
								</Annotation>
							</annotations> 
							<contactType>Me</contactType> 
							<quickName>logged in</quickName> 
							<passportName>fergalicious@twink.com</passportName> 
							<IsPassportNameHidden>false</IsPassportNameHidden> 
							<displayName>logged in</displayName> 
							<puid>0</puid> 
							<CID>0</CID> 
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
						<lastChange>2024-05-27T13:36:38Z</lastChange> 
					</Contact>
				</Contacts>
				<CircleResult>
					<CircleTicket>&lt;?xml version="1.0" encoding="utf-16"?&gt;&lt;SignedTicket xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ver="1" keyVer="1"&gt;&lt;Data&gt;PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTE2Ij8+DQo8VGlja2V0IHhtbG5zOnhzaT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEtaW5zdGFuY2UiIHhtbG5zOnhzZD0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEiPg0KICA8VFM+MDAwMC0wMS0wMVQwMDowMDowMDwvVFM+DQogIDxDSUQ+NzM4NDk5MzMxMTIwOTQzMjgzPC9DSUQ+DQo8L1RpY2tldD4=&lt;/Data&gt;&lt;Sig&gt;DOqhxYrdCjLF+8qoRWKV2/rWpcG1/y0c625tAtjZUdWA1uEpOG2XNY+JJUBoFQtpqnXeLzL2a2GL+QnkCFuN3T1k6h88Vu5AvXcG0CQWXerMJQgZg30MquyoTbjuvcdq0YeJf3CbXMYq/QLsQSC4za/BFxQX764I+R/btKzCR2MapcUvpqkGJ5RlupHZ7ts6QKCrOr4Qp/K15dfrNnYIBaIHzxgw01uBBKwIcI8fhnQngxhmQysqf2c0IE0NtX1CEzPg2vVVa3ixQ0w+12+owhi4cOSHjsevlE/oBoIYrC6cicvw91JOsOlEIjctWpPieis2cmGiFAbWtmPp+ikowg==&lt;/Sig&gt;&lt;/SignedTicket&gt;</CircleTicket> 
				</CircleResult>
				<Ab> 
					<abId>00000000-0000-0000-0000-000000000000</abId> 
					<abInfo> 
						<ownerPuid>0</ownerPuid> 
						<OwnerCID>0</OwnerCID> 
						<ownerEmail>fergalicious@twink.com</ownerEmail> 
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
					<lastChange>2024-05-27T13:36:38Z</lastChange> 
					<DynamicItemLastChanged>0001-01-01T00:00:00</DynamicItemLastChanged> 
					<createDate>2024-04-28T16:54:36Z</createDate> 
					<propertiesChanged /> 
				</Ab> 
			</ABFindContactsPagedResult> 
		</ABFindContactsPagedResponse> 
	</soap:Body> 
</soap:Envelope>`);
    }
});


module.exports = router;