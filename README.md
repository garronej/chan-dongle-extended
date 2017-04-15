# chan-dongle-extended

An extension for chan_dongle that feature: 

* PIN codes ( no need to disable LOCK anymore )
* Multipart SMS
* SMS status report ( confirm that SMS have been successfully delivered )
* SIM phonebook ( read and write contacts in SIM storage )
* Update SIM phone number ( if not wrote by the telecom operator )
* Auto configuration of devices ( no need to configure devices in dongle.conf anymore)

This module is a middleware between the Huawei devices and chan_dongle. 
It will work with any version of chan dongle.

You interact with the daemon via the cli tool `dongle`

````shell
$ dongle --help

Usage: dongle [options] [command]

  Commands:

    list                       List active dongle
    list-locked                List PIN/PUK locked dongles
    select [imei]              Select dongle for subsequent calls ( to avoid having to set --imei on each command)
    unlock [options]           provide SIM PIN or PUK to unlock dongle
    send [options]             Send SMS
    phonebook [options]        Get SIM card phonebook
    new-contact [options]      Store new contact in phonebook memory
    update-number [options]    Re write subscriber phone number on SIM card
    delete-contact [options]   Delete a contact from phonebook memory
    messages [options]         Get all received SMS

````

More info on every command by typing e.g: `dongle unlock --help`

All the listed commands are accessible via Asterisk Manager ( documentation incoming )

The module has a specific JavaScript client: `garronej/chan-dongle-extended-client`

#Dialplan example:

In this example we echo reply any message that any dongle receive.
````ini
[from-dongle]

;In this example we reply to the sender with the same content
exten = reassembled-sms,1,NoOp(reassembled-sms)
same = n,NoOp(SMS_NUMBER=${SMS_NUMBER})
same = n,NoOp(SMS_DATE=${SMS_DATE})
same = n,NoOp(URIDECODE(SMS_URI_ENCODED)=${URIDECODE(${SMS_URI_ENCODED})})
same = n,Set(MESSAGE_ID=${SHELL(dongle send --imei ${DONGLEIMEI} --number ${SMS_NUMBER} --uri-encoded-text "${SMS_URI_ENCODED}")})
;Or just use System instead of SHELL system if you don't care about the status report
;same = n,System(dongle send --imei ${DONGLEIMEI} --number ${SMS_NUMBER} --uri-encoded-text "${URIENCODE(${URIDECODE(${SMS_URI_ENCODED})})}")

;Check that the message have been received
exten = sms-status-report,1,NoOp(sms-status-report)
same = n,NoOp(STATUS_REPORT_DISCHARGE_TIME=${STATUS_REPORT_DISCHARGE_TIME})
same = n,NoOp(STATUS_REPORT_IS_DELIVERED=${STATUS_REPORT_IS_DELIVERED})
same = n,NoOp(STATUS_REPORT_ID=${STATUS_REPORT_ID})
same = n,NoOp(STATUS_REPORT_STATUS=${STATUS_REPORT_STATUS})
````

* Asterisk log: 

````raw
    -- Executing [reassembled-sms@from-dongle:1] NoOp("Local/init-reassembled-sms@from-dongle-00000053;2", "reassembled-sms") in new stack
    -- Executing [reassembled-sms@from-dongle:2] NoOp("Local/init-reassembled-sms@from-dongle-00000053;2", "SMS_NUMBER=+33636786385") in new stack
    -- Executing [reassembled-sms@from-dongle:3] NoOp("Local/init-reassembled-sms@from-dongle-00000053;2", "SMS_DATE=2017-04-14T21:33:07.000Z") in new stack 
    -- Executing [reassembled-sms@from-dongle:4] NoOp("Local/init-reassembled-sms@from-dongle-00000053;2", "URIDECODE(SMS_URI_ENCODED)= Un mal qui répand la terreur,
    -- Mal que le Ciel en sa fureur
    -- Inventa pour punir les crimes de la terre,
    -- La Peste (puisqu’il faut l’appeler par son nom),
    -- Capable d’enrichir en un jour l’Achéron,
    -- Faisait aux Animaux la guerre.
    -- Ils ne mouraient pas tous, mais tous étaient frappés :
    -- On n’en voyait point d’occupés
    -- À chercher le soutien d’une mourante vie ;
    -- Nul mets n’excitait leur envie ;
    -- Ni Loups ni Renards n’épiaient
    -- La douce et l’innocente proie ;
    -- Les Tourterelles se fuyaient :
    -- Plus d’amour, partant plus de joie.
    -- Le Lion tint conseil, et dit : « Mes chers amis,
    -- Je crois que le Ciel a permis
    -- Pour nos péchés cette infortune.
    -- Que le plus coupable de nous
    -- Se sacrifie aux traits du céleste courroux ;
    -- Peut-être il obtiendra la guérison commune.
    -- L’histoire nous apprend qu’en de tels accidents
    -- On fait de pareils dévouements.
    -- 🐵🙈🙉🙊") in new stack



    -- Executing [sms-status-report@from-dongle:1] NoOp("Local/init-sms-status-report@from-dongle-00000054;2", "sms-status-report") in new stack
    -- Executing [sms-status-report@from-dongle:2] NoOp("Local/init-sms-status-report@from-dongle-00000054;2", "STATUS_REPORT_DISCHARGE_TIME=2017-04-14T21:33:54.000Z") in new stack
    -- Executing [sms-status-report@from-dongle:3] NoOp("Local/init-sms-status-report@from-dongle-00000054;2", "STATUS_REPORT_IS_DELIVERED=true") in new stack
    -- Executing [sms-status-report@from-dongle:4] NoOp("Local/init-sms-status-report@from-dongle-00000054;2", "STATUS_REPORT_ID=1492205624999") in new stack
    -- Executing [sms-status-report@from-dongle:5] NoOp("Local/init-sms-status-report@from-dongle-00000054;2", "STATUS_REPORT_STATUS=COMPLETED_RECEIVED") in new stack

````

#Requirement

* `node >= 4.0.0`
* `asterisk and chan_dongle`
* `python` (`v2.7` recommended, `v3.x.x` is __*not*__ supported) `pip and virtualenv`
* `[tty0tty](https://github.com/garronej/tty0tty)` 
(install from the fork garronej/tty0tty, not the main repository or you will be limited to 4 dongles )
* `make`
* A proper C/C++ compiler toolchain, like [GCC](https://gcc.gnu.org)

Note: Before installing you may want to backup your dongle.conf file.

#Installation guide ( on raspbian, can be adapted to other linux distribution )

* Install general dependencies:
````bash
$ sudo apt-get install build-essential python-pip libudev-dev && sudo pip install virtualenv
````

* Installing tty0tty: 
Follow the instructions @: https://github.com/garronej/tty0tty

* Instating Node.js: 
Follow the instructions @: https://gist.github.com/garronej/6a1eecb9dde9d9184014c5d25a9b6d1c
Or do it your way...

* Install the module
``` bash
$ sudo npm install --unsafe-perm -g garronej/chan-dongle-extended
```

PS: You don't need --unsafe-perm if you use npm link

#Uninstall
``` bash
$ sudo dongle-extended-admin preuninstall && sudo  npm uninstall --unsafe-perm -g chan-dongle-extended
```