# Chan-dongle-extended

[WEBSITE](https://garronej.github.io/chan-dongle-extended-pages/)

## Installing node 

Note for 2021: Everything will run smoothly only on Debian 9: Stretch

### On armv6 hosts ( raspberry pi 1 )
``` bash
# We can't install it from the repository so we have to download it manually:
# ( The download link is on the download page of the node.js website )
$ cd ~ && wget https://nodejs.org/dist/v8.12.0/node-v8.12.0-linux-armv6l.tar.xz
$ tar xf node-v8.*-linux-armv6l.tar.xz
# Add the path to node bin dir to the PATH, .bashrc:  export PATH=/home/pi/node-v8.12.0-linux-armv6l/bin:$PATH
$ source ~/.bashrc
$ sudo su
$ npm install -g npm@latest-5
```

### On any other host ( armv7, x32, x64 )
``` bash
$ # On a fresh install of debian 8 Jessie:
$ apt-get update && apt-get upgrade -y

$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
$ sudo apt-get install -y nodejs
$ sudo npm install -g npm@latest-5
```

## Publish release
To build, bundle and publish a new release for 
a specifics arch there is no need to ``npm install`` just clone
this repo then: 

* run ``npm run partial_install`` ( without sudo, only first time )
* run ``npm run release`` ( without sudo )

## Run local copy of the code for debugging
``` bash
$ npm install
$ sudo ./node dist/bin/installer install
$ npm start 
```

## Note regarding dependencies

At the time of writing these lines libudev-dev ( https://packages.debian.org/fr/jessie/libudev-dev )
is the development package targeting 'libudev1' for jessie, stretch and buster ( oldstable, stable and testing)
Make sure it is still the case when building a new release. 
Indeed 'cheery/node-udev' is not recompiled on client's host so if it happen that libudev1 is not available on a 
resent release of debian or ubuntu it will not work.
In short make sure that we does not found ourselves in the situation of libssl-dev ( https://packages.debian.org/fr/jessie/libssl-dev )
Where the target is the packet 'libssl1.0.0' for jessie and 'libssl1.1' for stretch and buster.

UPDATE: The following note would be purposeful 
only if we decided on the future NOT to recompile
'cheery/node-udev' on the client host but currently 
we do so the note can be ignored.
