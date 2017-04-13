#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

SCRIPT=$DIR/../../dist/bin/scripts.js

node $SCRIPT uninstall

npm uninstall -g --unsafe-perm dongle-extended