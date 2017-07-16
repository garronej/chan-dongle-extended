# Chan-dongle-extended

NOTE: This work in progress the API is likely to change greatly.

An extension for chan_dongle that feature: 

* PIN/PUK codes:
     No need to disable LOCK anymore, list connected dongle that need to be
     unlocked, provide a PIN or PUK, if the unlocking was successful the module
     will save the code for the SIM so you don't have to provide it again.
* Multipart SMS: 
    Reliably Send and receive multipart SMS, fix all encoding problems.
* SMS status report:
    Confirm that SMS have been successfully delivered.
* SIM phonebook:
    Read and write contacts in SIM storage.
* Write own number on SIM memory.
* Auto configuration of devices:
    No need to configure devices in dongle.conf anymore,
    when a supported device is connected it is automatically detected
    by the module and instantiated for you.

This module is a middleware between the Huawei devices and chan_dongle. 
It will work with any version of asterisk/chan_dongle.

There is two way to interact with the module: 

* For local usage: The cli tool
* For remote usage: Asterisk Manager

The cli tool is accessible via the unix command: `dongle`

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

# Dialplan example:

In this example we reply "OK, got you! 👌" to any message we receive

NOTE: All channel variable set in both reassembled-sms and sms-status-report extensions:
DONGLENAME, DONGLEPROVIDER, DONGLEIMEI, DONGLEIMSI, DONGLENUMBER

````ini
[from-dongle]

;In this example we reply to the sender with the same content
exten = reassembled-sms,1,NoOp(reassembled-sms)
same = n,NoOp(SMS_NUMBER=${SMS_NUMBER})
same = n,NoOp(SMS_DATE=${SMS_DATE})
same = n,NoOp(BASE64_DECODE(SMS_BASE64)=${BASE64_DECODE(${SMS_BASE64})})
same = n,Set(MESSAGE_ID=${SHELL(dongle send --imei ${DONGLEIMEI} --number ${SMS_NUMBER} --text-base64 ${BASE64_ENCODE(OK, got you! 👌)})})
;Or just use System instead of SHELL system if you don't care about the status report
;same = n,System(dongle send --i ${DONGLEIMEI} --n ${SMS_NUMBER} --t64 ${BASE64_ENCODE(OK, got you! 👌)})
same = n,Hangup()

;Check that the message have been received
exten = sms-status-report,1,NoOp(sms-status-report)
same = n,NoOp(STATUS_REPORT_DISCHARGE_TIME=${STATUS_REPORT_DISCHARGE_TIME})
same = n,NoOp(STATUS_REPORT_IS_DELIVERED=${STATUS_REPORT_IS_DELIVERED})
same = n,NoOp(STATUS_REPORT_ID=${STATUS_REPORT_ID})
same = n,NoOp(STATUS_REPORT_STATUS=${STATUS_REPORT_STATUS})
same = n,Hangup()
````

* Asterisk log: 

````raw
    -- Executing [reassembled-sms@from-dongle:1] NoOp("Local/init-reassembled-sms@from-dongle-0000001b;2", "reassembled-sms") in new stack
    -- Executing [reassembled-sms@from-dongle:2] NoOp("Local/init-reassembled-sms@from-dongle-0000001b;2", "SMS_NUMBER=+33636786385") in new stack
    -- Executing [reassembled-sms@from-dongle:3] NoOp("Local/init-reassembled-sms@from-dongle-0000001b;2", "SMS_DATE=2017-05-14T17:37:45.000Z") in new stack
    -- Executing [reassembled-sms@from-dongle:4] NoOp("Local/init-reassembled-sms@from-dongle-0000001b;2", "BASE64_DECODE(SMS_BASE64)=Un mal qui répand la terreur,
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
    -- Peut-être il obtiendra la guérison commune.") in new stack
    -- Executing [reassembled-sms@from-dongle:5] Set("Local/init-reassembled-sms@from-dongle-0000001b;2", "MESSAGE_ID=1494783564908
    -- ") in new stack
    -- Executing [reassembled-sms@from-dongle:6] Hangup("Local/init-reassembled-sms@from-dongle-0000001b;2", "") in new stack

    ... Then when "OK, got you! 👌"  received :

    -- Goto (from-dongle,sms-status-report,1)
    -- Executing [sms-status-report@from-dongle:1] NoOp("Local/init-sms-status-report@from-dongle-0000001c;2", "sms-status-report") in new stack
    -- Executing [sms-status-report@from-dongle:2] NoOp("Local/init-sms-status-report@from-dongle-0000001c;2", "STATUS_REPORT_DISCHARGE_TIME=2017-05-14T17:39:27.000Z") in new stack
    -- Executing [sms-status-report@from-dongle:3] NoOp("Local/init-sms-status-report@from-dongle-0000001c;2", "STATUS_REPORT_IS_DELIVERED=true") in new stack
    -- Executing [sms-status-report@from-dongle:4] NoOp("Local/init-sms-status-report@from-dongle-0000001c;2", "STATUS_REPORT_ID=1494783564908") in new stack
    -- Executing [sms-status-report@from-dongle:5] NoOp("Local/init-sms-status-report@from-dongle-0000001c;2", "STATUS_REPORT_STATUS=COMPLETED_RECEIVED") in new stack
    -- Executing [sms-status-report@from-dongle:6] Hangup("Local/init-sms-status-report@from-dongle-0000001c;2", "") in new stack
````

Note: SMS_BASE64 truncate message of more than 1024 byte, this is an expected behavior, 
it is to avoid asterisk buffer overflow. You can use the 
SMS_TEXT_SPLIT_COUNT=n and SMS_BASE64_PART_0..n-1 variables to retrieve very long SMS. 
In order to reassemble the message you must decode each part then concatenate.

# Requirement

* `node >= 4.0.0`
* `asterisk and chan_dongle`
* `python` (`v2.7` recommended, `v3.x.x` is __*not*__ supported) `pip and virtualenv`
* `[tty0tty](https://github.com/garronej/tty0tty)` 
(install from the fork garronej/tty0tty, not the main repository or you will be limited to 4 dongles )
* `make`
* A proper C/C++ compiler toolchain, like [GCC](https://gcc.gnu.org)

Note: Before installing you may want to backup your dongle.conf file.

# Installation guide ( on raspbian, can be adapted to other linux distribution )

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

If you can globaly install package without root privilege ( cf: https://docs.npmjs.com/getting-started/fixing-npm-permissions )
Then logged with your user profile ( eg "pi" or "admin" )
```` bash
$  npm install -g garronej/chan-dongle-extended
$  sudo $(which dongle-extended-admin) postinstall
````
The second line will install a systemd service to start the daemon and optionaly to load it at boot time.
You will be asked to tell which user will run the daemon, you should should use your unix user profile ( eg: user: pi, group: pi )

Alternatively, if you can't install npm package globaly:
``` bash
$ sudo npm install --unsafe-perm -g garronej/chan-dongle-extended && sudo dongle-extended-admin postinstall
```


# Uninstall

```` bash
$  sudo $(which dongle-extended-admin) preuninstall
$  npm install -g garronej/chan-dongle-extended
````

Alternatively: 

``` bash
$ sudo dongle-extended-admin preuninstall && sudo  npm uninstall --unsafe-perm -g chan-dongle-extended
```

# For dev:


* Install
``` bash
$ git clone https://github.com/garronej/chan-dongle-extended
$ cd chan-dongle-extended
$ npm install
$ ln -s $(pwd)/dist/bin/cli.js ~/.npm-global/bin/dongle
$ sudo node dist/bin/scripts.js postinstall
```
* Run
``` bash
$ npm start
```
* Uninstall
``` bash
$ sudo node dist/bin/scripts.js preuninstall
$ rm ~/.npm-global/bin/dongle
```
