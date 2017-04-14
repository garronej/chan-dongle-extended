#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

SCRIPTS=$DIR/../../dist/bin/scripts.js

set -e
function cleanup {

    echo process stoped, running poststop

    sleep 2

    sudo node $SCRIPTS poststop

}
trap cleanup EXIT

sudo systemctl stop dongle-extended

sleep 2

sudo node $SCRIPTS prestart

DEBUG=_* node $DIR/../../dist/lib/main