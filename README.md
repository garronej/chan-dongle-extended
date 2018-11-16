# Chan-dongle-extended

[README](https://garronej.github.io/chan-dongle-extended/)

* Testing the current release on a specific host:
``` bash
# Install the service ( see https://garronej.github.io/chan-dongle-extended/ )

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

* Prepare:

Steps to perform before publishing a new release or  
installing from source.

``` bash
# ==> Installing node.js, for armv6 only !
# We can't install it from the repository so we have to download it manually:
# ( The download link is on the download page of the node.js website )
$ cd ~ && wget https://nodejs.org/dist/v8.12.0/node-v8.12.0-linux-armv6l.tar.xz
$ tar xf node-v8.*-linux-armv6l.tar.xz
# Add the path to node bin dir to the PATH, .bashrc:  export PATH=/home/pi/node-v8.12.0-linux-armv6l/bin:$PATH
$ source ~/.bashrc
# Make sure that we have node by typing node -v

# ==>Install node.js on a host that is not armv6
# ( https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions )
$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
$ sudo apt-get install -y nodejs
$ sudo npm install -g npm

# Install dependencies needed to perform npm install
$ sudo apt-get install libudev-dev python python-pip
$ sudo pip install virtualenv

$ git clone https://github.com/garronej/chan-dongle-extended
$ cd chan-dongle-extended
$ npm install
```

* Publish a new release:
``` bash
# Creating tarball, ( will generate a file docs/release/dongle_[arch].tar.gz )
$ npm run tarball
```

* Install from source 
See the options by running: 
````bash
#Append " --help" to consult install options.
$ sudo ./node dist/bin/installer install
````

* Uninstall
```bash
$ sudo dongle_uninstaller run
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
