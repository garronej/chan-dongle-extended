---
title: chan-dongle-extended
---

## Motivations

``asterisk-chan-dongle`` let you use Huawei 3G dongles to place phone calls  
via ``Asterisk``, unfortunately it handle SMS very poorly, it is complicated to   
setup and it is quite unstable.

This project aim to automate the compilation/installation/configuration  
of ``asterisk-chan-dongle`` alongside fixing bugs and providing many new features.

## Features: 

* **PIN/PUK codes management**:  
    No need to disable LOCK anymore, list connected dongle that need to be  
    unlocked, provide a PIN or PUK, if the unlocking was successful the module  
    will save the code for the SIM so you don't have to provide it again.  
* **Multipart SMS**:  
    Reliably Send and receive multipart SMS, fix all encoding problems.  
* **SMS status report**:  
    Confirm that SMS have been successfully delivered.  
* **SIM phonebook**:  
    Read and write contacts in SIM storage.  
* **Auto configuration of devices**:  
    No need to configure devices in dongle.conf anymore,  
    when a supported device is connected it is automatically detected  
    by the module and instantiated for you.  

## Installing

System requirements:
* Debian/Raspbian jessie or newer. ( Should work on Ubuntu as well but untested )

To install simply run this command:

````bash
wget -nc -q -O - garronej.github.io/chan-dongle-extended/install.sh | sudo bash
````

![image](https://user-images.githubusercontent.com/6702424/48592742-23117b00-e94a-11e8-80d4-a52142ad96fc.png)


This program act as a system service to stop the service run: 
````bash
sudo systemctl stop chan_dongle
````

To uninstall ``chan-dongle-extended`` run:  
````bash
sudo dongle_uninstaller run
````

Logfile:  
````bash
tail -f /usr/share/dongle/working_directory/log
````

### Behavior on unrecoverable dongle crash.

The service will do what it can to recover from dongle error  
however sometimes the modems just crash and need to be
unplugged/reconnected. This can be a big issue if you do not have  
physical access to the device.  
The only option in this case is to allow ``chan-dongle-extended`` to reboot  
the host when a dongle is unrecoverable crashed.

To grant the permission edit ``/usr/share/dongle/working_directory/install_options.json``
````json
{
    "allow_host_reboot_on_dongle_unrecoverable_crash": true
}
````

## API

The service come bundled with a CLI tool ``dongle``

![image](https://user-images.githubusercontent.com/6702424/48590982-0709db80-e942-11e8-8456-af247c773fdf.png)

![image](https://user-images.githubusercontent.com/6702424/48590810-47b52500-e941-11e8-9fb0-7f54840cfd95.png)

Once unlocked you can see that the modem is handled by ``asterisk-chan-dongle``

![image](https://user-images.githubusercontent.com/6702424/48592557-3ec85180-e949-11e8-9fa3-44d07c1d7517.png)

A npm module is available to interface the service programmatically: ``garronej/chan-dongle-extended-client`` ( not documented yet )

## Handling multi parts SMS via the dialplan.

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
-- Executing [sms-status-report@from-dongle:1] NoOp("Local/init-sms-status-report@from-dongle-0001c;2", "sms-status-report") in new stack
-- Executing [sms-status-report@from-dongle:2] NoOp("Local/init-sms-status-report@from-dongle-0001c;2", "STATUS_REPORT_DISCHARGE_TIME=2017-05-14T17:39:27.000Z") in new stack
-- Executing [sms-status-report@from-dongle:3] NoOp("Local/init-sms-status-report@from-dongle-0001c;2", "STATUS_REPORT_IS_DELIVERED=true") in new stack
-- Executing [sms-status-report@from-dongle:4] NoOp("Local/init-sms-status-report@from-dongle-0001c;2", "STATUS_REPORT_ID=1494783564908") in new stack
-- Executing [sms-status-report@from-dongle:5] NoOp("Local/init-sms-status-report@from-dongle-0001c;2", "STATUS_REPORT_STATUS=COMPLETED_RECEIVED") in new stack
-- Executing [sms-status-report@from-dongle:6] Hangup("Local/init-sms-status-report@from-dongle-0001c;2", "") in new stack
````

Note: SMS_BASE64 truncate message of more than 1024 byte, this is an expected behavior, 
it is to avoid asterisk buffer overflow. You can use the 
SMS_TEXT_SPLIT_COUNT=n and SMS_BASE64_PART_0..n-1 variables to retrieve very long SMS. 
In order to reassemble the message you must decode each part then concatenate.

## Report bugs

Any feedback highly appreciated at *joseph.garrone.gj@gmail.com*
