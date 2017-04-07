# chan-dongle-extended
An extension for chan_dongle: PIN codes, multipart SMS, contacts and auto configuration of the GSM dongle on connect.

#Requirement

* `node >= 4.0.0`
* `asterisk and chan_dongle`
* `python` (`v2.7` recommended, `v3.x.x` is __*not*__ supported) `pip and virtualenv`
* `[tty0tty](https://github.com/garronej/tty0tty)` (install from the fork garronej/tty0tty, not the main repo )
* `make`
* A proper C/C++ compiler toolchain, like [GCC](https://gcc.gnu.org)

#Installation guide ( on raspbian, can be adapted to other linux distribution )

* Install general dependencies:
````bash
$ sudo apt-get install build-essential python-pip libudev-dev && sudo pip install virtualenv
````

* Installing tty0tty: 
Follow the instructions on: https://github.com/garronej/tty0tty

* Instating Node.js: 
Follow the instructions on: https://gist.github.com/garronej/6a1eecb9dde9d9184014c5d25a9b6d1c

* Install the module
``` bash
$ sudo npm install --unsafe-perm -g garronej/chan-dongle-extended
```

#Uninstall
``` bash
$ sudo dongle-installer remove-udev-rules && sudo dongle-installer uninstall-service && sudo npm uninstall --unsafe-perm -g chan-dongle-extended
```
