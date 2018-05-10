#!/bin/bash

INSTALL_PATH=/usr/share/dongle
TARBALL_PATH=/usr/src/dongle.tar.gz

id -u dongle > /dev/null 2>&1

if [ $? -eq 0 ]
then

        echo "There is already unix user 'dongle' on the system. Aborting"

        exit 1

fi

if [ -d "$DIRECTORY" ]; then

    echo "Directory $INSTALL_PATH already exsist"

    exit 1

fi

URL=""

function build_url(){
    URL="https://github.com/garronej/dongle/releases/download/latest/dongle_"$1".tar.gz"
}

function does_url_exsist(){
    wget -S --spider $URL 2>&1 | grep "302 Found" > /dev/null 2>&1
}

build_url $(uname -m)

uname -m | grep arm > /dev/null 2>&1

if [ $? -eq 0 ]; then

        echo "arm proc"

    does_url_exsist

    if [ $? -ne 0 ]; then

            echo "using armv6l"

            build_url armv6l

    fi

fi

does_url_exsist

if [ $? -ne 0 ]; then
        echo "source not found"
        exit 1
fi

wget $URL -O /usr/src/dongle.tar.gz

mkdir /usr/share/dongle

tar -xzf $TARBALL_PATH -C $INSTALL_PATH

rm $TARBALL_PATH

cd $INSTALL_PATH

./node dist/bin/configure_dist
