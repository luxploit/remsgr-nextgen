<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"> 
	<soap:Body> 
		<GetClientConfigResponse xmlns="http://www.msn.com/webservices/Messenger/Client"> 
			<GetClientConfigResult>
				<![CDATA[<MsgrConfig>
    <Simple>
        <Config>
            <ExpiresInDays>0</ExpiresInDays>
        </Config>
        <DisablePhoneDialer>1</DisablePhoneDialer>
        <MinFlashPlayer BuildNumber="60" MajorVersion="7" MinorVersion="0"></MinFlashPlayer>
        <Relay>
            <Enabled>0</Enabled>
        </Relay>
        <TrustedDomains>
            <domain name="192.168.1.62"/>
            <domain name="10.147.18.54"/>
            <domain name="remsgr.net"/>
            <domain name="messenger.remsgr.net"/>
            <domain name="config.remsgr.net"/>
        </TrustedDomains>
        <ErrorResponseTable>
            <Feature type="0" name="Login">
                <Entry hr="0x80072EE7" action="3"></Entry>
                <Entry hr="0x81000306" action="3"></Entry>
                <Entry hr="0x80072EFD" action="3"></Entry>
                <Entry hr="0x81000362" action="3"></Entry>
                <Entry hr="0x8100030E" action="3"></Entry>
                <Entry hr="0x80072745" action="3"></Entry>
                <Entry hr="0x800701F7" action="3"></Entry>
                <Entry hr="0x80072EFF" action="3"></Entry>
                <Entry hr="0x81000363" action="3"></Entry>
                <Entry hr="0x81000395" action="3"></Entry>
                <Entry hr="0x800B0001" action="3"></Entry>
                <Entry hr="0x81000323" action="3"></Entry>
                <Entry hr="0x80072F19" action="3"></Entry>
                <Entry hr="0x800701F8" action="3"></Entry>
                <Entry hr="0x80072746" action="3"></Entry>
                <Entry hr="0x800701F6" action="3"></Entry>
                <Entry hr="0x81000377" action="3"></Entry>
                <Entry hr="0x81000314" action="3"></Entry>
                <Entry hr="0x81000378" action="3"></Entry>
                <Entry hr="0x80072EFF" action="3"></Entry>
                <Entry hr="0x80070190" action="3"></Entry>
                <Entry hr="0x80070197" action="3"></Entry>
                <Entry hr="0x80048820" action="3"></Entry>
                <Entry hr="0x80048829" action="3"></Entry>
                <Entry hr="0x80048834" action="3"></Entry>
                <Entry hr="0x80048852" action="3"></Entry>
                <Entry hr="0x8004886a" action="3"></Entry>
                <Entry hr="0x8004886b" action="3"></Entry>
            </Feature>
            <Feature type="2" name="MapFile">
                <Entry hr="0x810003F0" action="3"></Entry>
                <Entry hr="0x810003F1" action="3"></Entry>
                <Entry hr="0x810003F2" action="3"></Entry>
                <Entry hr="0x810003F3" action="3"></Entry>
                <Entry hr="0x810003F4" action="3"></Entry>
                <Entry hr="0x810003F5" action="3"></Entry>
                <Entry hr="0x810003F6" action="3"></Entry>
                <Entry hr="0x810003F7" action="3"></Entry>
            </Feature>
        </ErrorResponseTable>
    </Simple>
    <TabConfig>
        <msntabdata>
            <tab>
                <type>page</type>
                <contenturl>https://open.spotify.com/intl-fr/artist/25uiPmTg16RbhZWAqwLBy5</contenturl>
                <hiturl>https://open.spotify.com/intl-fr/artist/25uiPmTg16RbhZWAqwLBy5</hiturl>
                <image>https://i.scdn.co/image/ab6761610000e5eb936885667ef44c306483c838</image>
                <name>Listen to Charli XCX today!</name>
                <tooltip>Listen to Charli XCX today!</tooltip>
                <siteid>0</siteid>
                <notificationid>0</notificationid>
            </tab>
        </msntabdata>
        <msntabsettings>
            <oemdisplaylimit>1</oemdisplaylimit>
            <oemtotallimit>1</oemtotallimit>
        </msntabsettings>
    </TabConfig>
    <AbchCfg>
        <abchconfig>
            <url>{{ host }}abservice/abservice.asmx</url>
        </abchconfig>
    </AbchCfg>
    <SpacesDownload>http://spaces.live.com/downloadA</SpacesDownload>
    <LocalizedConfig Market="en-US">
        <SpacesDownload>http://spaces.live.com/downloadB</SpacesDownload>
        <DynamicContent>
            <premium>
                <winks2 visibleto="7.0.729 and greater">
                    <providersiteid>60971</providersiteid>
                    <providerurl>http://apps.escargot.chat/content/winks/</providerurl>
                    <slots>
                        <URL id="1">http://apps.escargot.chat/content/winks/?id=screen-punch</URL>
                        <URL id="2">http://apps.escargot.chat/content/winks/?id=sup-dawg</URL>
                        <URL id="3">http://apps.escargot.chat/content/winks/?id=flower-fart</URL>
                        <URL id="4">http://apps.escargot.chat/content/winks/?id=sup-dawg</URL>
                        <URL id="5">http://apps.escargot.chat/content/winks/?id=pc-explosion</URL>
                        <URL id="6">http://apps.escargot.chat/content/winks/?id=smiley-faces</URL>
                        <URL id="7">http://apps.escargot.chat/content/winks/?id=break-dancer</URL>
                        <URL id="8">http://apps.escargot.chat/content/winks/?id=bugs-bunny</URL>
                    </slots>
                </winks2>
            </premium>
        </DynamicContent>
        <AdMainConfig>
            <TextAdRefresh>1</TextAdRefresh>
            <TextAdServer>{{ config_host }}msn/textads</TextAdServer>
            <AdBanner20URL Refresh="60">{{ config_host }}msn/bannersads</AdBanner20URL>
        </AdMainConfig>
        <AppDirConfig>
            <AppDirPageURL>{{ host }}games/list?charli=xcx</AppDirPageURL>
            <AppDirSeviceURL>http://apps.escargot.chat/activities/service/</AppDirSeviceURL>
            <AppDirVersionURL>http://apps.escargot.chat/activities/version/</AppDirVersionURL>
        </AppDirConfig>
        <MSNSearch>
            <DesktopInstallURL>https://www.google.com/search?q=$QUERY$&amp;source=hp</DesktopInstallURL>
            <ImagesURL>https://www.google.com/search?q=$QUERY$&amp;source=lnms&amp;tbm=isch</ImagesURL>
            <NearMeURL>https://www.google.com/search?q=$QUERY$&amp;source=hp</NearMeURL>
            <NewsURL>https://www.google.com/search?q=$QUERY$&amp;source=lmns&amp;tbm=vid</NewsURL>
            <SearchKidsURL>https://www.google.com/search?q=$QUERY$&amp;source=hp&amp;safe=active</SearchKidsURL>
            <SearchURL>https://www.google.com/search?q=$QUERY$&amp;source=hp</SearchURL>
            <SharedSearchURL>https://www.google.com/search?q=$QUERY$&amp;source=hp</SharedSearchURL>
            <SharedSearchURL2>https://www.google.com/search?q=$QUERY$&amp;source=hp</SharedSearchURL2>
        </MSNSearch>
        <MsnTodayConfig>
            <MsnTodayURL>http://remsgr.net/</MsnTodayURL>
        </MsnTodayConfig>
        <MusicIntegration URL="https://www.last.fm/search/tracks?q=$ARTIST$+$TITLE$"/>
        <RL>
            <ViewProfileURL>http://g.msn.com/5meen_us/106?%1&amp;Plcid=%2!hs!&amp;%3&amp;Country=%4!hs!&amp;BrandID=%5&amp;passport=%6</ViewProfileURL>
        </RL>
        <TermsOfUse>
            <TermsOfUseSID>956</TermsOfUseSID>
            <TermsOfUseURL>https://escargot.chat/legal/terms/</TermsOfUseURL>
        </TermsOfUse>
    </LocalizedConfig>
</MsgrConfig>]]>
			</GetClientConfigResult> 
		</GetClientConfigResponse> 
	</soap:Body> 
</soap:Envelope>