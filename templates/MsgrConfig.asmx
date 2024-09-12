<MsgrConfig>
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
            <domain name="192.168.1.62"/>
            <domain name="remsgr.net"/>
            <domain name="messenger.remsgr.net"/>
            <domain name="testing.remsgr.net"/>
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
                <contenturl>https://mbasic.facebook.com/</contenturl>
                <hiturl>https://mbasic.facebook.com/</hiturl>
                <image>https://{{ host }}/static/shortcuts/fb.png</image>
                <name>Facebook</name>
                <tooltip>Facebook</tooltip>
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
            <url>https://{{ host }}/abservice/abservice.asmx</url>
        </abchconfig>
    </AbchCfg>
    <SpacesDownload>http://spaces.live.com/downloadA</SpacesDownload>
    <LocalizedConfig Market="en-US">
        <SpacesDownload>http://spaces.live.com/downloadB</SpacesDownload>
        <DynamicContent>
            <premium>
                <winks2 visibleto="7.0.729 and greater">
                    <providersiteid>60971</providersiteid>
                    <providerurl></providerurl>
                    <slots>
                    </slots>
                </winks2>
            </premium>
        </DynamicContent>
        <AdMainConfig>
            <TextAdRefresh>1</TextAdRefresh>
            <TextAdServer>https://{{ config_host }}/msn/textads</TextAdServer>
            <AdBanner20URL Refresh="60">https://{{ config_host }}/msn/bannersads</AdBanner20URL>
        </AdMainConfig>
        <AppDirConfig>
            <AppDirPageURL>https://{{ host }}/games/list?charli=xcx</AppDirPageURL>
            <AppDirSeviceURL>https://{{ host }}/games/service/</AppDirSeviceURL>
            <AppDirVersionURL>https://{{ host }}/games/version/</AppDirVersionURL>
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
            <TermsOfUseURL>https://remsgr.net</TermsOfUseURL>
        </TermsOfUse>
    </LocalizedConfig>
</MsgrConfig>