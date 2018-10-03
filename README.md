# Chan-dongle-extended

NOTE: This work in progress the API is likely to change greatly.

An extension for asterisk chan_dongle that feature: 

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
Anyway by installing this module asterisk chan dongle will be automatically installed.

There is two way to interact with the module: 

* For local usage: The cli tool
* For remote usage: garronej/chan-dongle-extended-client

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

The module is deigned to be interfaced via this client: `garronej/chan-dongle-extended-client`

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
same = n,Set(SEND_TIME=${SHELL(dongle send --imei ${DONGLEIMEI} --number ${SMS_NUMBER} --text-base64 ${BASE64_ENCODE(OK, got you! 👌)})})
;Or just use System instead of SHELL system if you don't care about the status report
;same = n,System(dongle send -i ${DONGLEIMEI} -n ${SMS_NUMBER} -T ${BASE64_ENCODE(OK, got you! 👌)})
same = n,Hangup()

;Check that the message have been received
exten = sms-status-report,1,NoOp(sms-status-report)
same = n,NoOp(STATUS_REPORT_DISCHARGE_TIME=${STATUS_REPORT_DISCHARGE_TIME})
same = n,NoOp(STATUS_REPORT_IS_DELIVERED=${STATUS_REPORT_IS_DELIVERED})
same = n,NoOp(STATUS_REPORT_SEND_TIME=${STATUS_REPORT_ID})
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

# Note for dev ops:

* Releasing:
``` bash

# ==> Installing node.js, for armv6 only !
# We can't install it from the repository so we have to download it manually:

# ( The download link is on the download page of the node.js website )
$ cd ~ && wget https://nodejs.org/dist/v8.12.0/node-v8.12.0-linux-armv6l.tar.xz
$ tar xf node-v8.*-linux-armv6l.tar.xz
# Add the path to node bin dir to the PATH, .bashrc:  export PATH=/home/pi/node-v8.12.0-linux-armv6l/bin:$PATH
$ source ~/.bashrc
# Make sure that we have node by typing node -v

# Install node.js on a host that is not armv6
# ( https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions )
$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
$ sudo apt-get install -y nodejs
$ sudo npm install -g npm

# Install dependencies needed to perform npm install
# UPDATE: The following note would be purposeful 
# only if we decided on the future NOT to recompile
# 'cheery/node-udev' on the client host but currently 
# we do so the note can be ignored.
# NOTE: 
# At the time of writing these lines libudev-dev ( https://packages.debian.org/fr/jessie/libudev-dev )
# is the development package targeting 'libudev1' for jessie, stretch and buster ( oldstable, stable and testing)
# Make sure it is still the case when building a new release. 
# Indeed 'cheery/node-udev' is not recompiled on client's host so if it happen that libudev1 is not available on a 
# resent release of debian or ubuntu it will not work.
# In short make sure that we does not found ourselves in the situation of libssl-dev ( https://packages.debian.org/fr/jessie/libssl-dev )
# Where the target is the packet 'libssl1.0.0' for jessie and 'libssl1.1' for stretch and buster.
$ sudo apt-get install libudev-dev python python-pip
$ sudo pip install virtualenv

$ git clone https://github.com/garronej/chan-dongle-extended
$ cd chan-dongle-extended
$ npm install

# Creating tarball, ( will generate a file dongle_[arch].tar.gz )
# This file need to be uploaded in 'Latest' release here:
# https://github.com/garronej/dongle/releases
$ npm run tarball

```

* Testing the latest release:
``` bash

$ wget -nc -q -O - https://github.com/garronej/dongle/raw/master/install.sh | sudo bash

# [ Plug a USB 3G dongle holding a sim card to the host. ]

# A locked dongle should be listed, copy the IMSI
$ dongle list 

$ dongle select [imsi]

$ dongle unlock -p 1234

#Wait ~15s

$ dongle send -t "foo bar baz" -n 0636786385

# [ Checks that the message is well received ]

#Optionally test the other functionalities: 

# List the available commands:
$ dongle --help 

# Get details on how to use a particular command ( here example with the 'send' command )
$ dongle send --help

# Do not forget to read the output,
# it will tell what packages are no longer needed and can be purged.
$ sudo dongle_uninstaller run

```
