#!/bin/bash

# TODO: Test if debian or ubuntu distribution comply to requirements.

INSTALL_PATH=/usr/share/dongle
TARBALL_PATH=/tmp/dongle.tar.gz

if [[ $EUID -ne 0 ]]; then
    echo "This script require root privileges."
    exit 1
fi

echo "We will now download and install chan-dongle-extended, it may take some time."

if [ -d "$INSTALL_PATH" ]; then

    echo "Directory $INSTALL_PATH already exsist, uninstalling previous install"
    
    dongle_uninstaller run 2>/dev/null
    
    rm -rf $INSTALL_PATH

fi

URL="https://garronej.github.io/chan-dongle-extended/releases/dongle_latest_"$(uname -m)".tar.gz"

wget $URL -q --show-progress -O $TARBALL_PATH

mkdir $INSTALL_PATH

tar -xzf $TARBALL_PATH -C $INSTALL_PATH

rm $TARBALL_PATH

cd $INSTALL_PATH

./node dist/bin/installer install
