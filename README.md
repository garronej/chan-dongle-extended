# chan-dongle-extended
An extension for chan_dongle: PIN codes, multipart SMS, contacts.

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
Follow the instructions on: http://node-arm.herokuapp.com/

* Install the module
``` bash
$ sudo npm install --unsafe-perm -g garronej/chan-dongle-extended
```

#Uninstall
``` bash
$ sudo npm install --unsafe-perm -g chan-dongle-extended
```