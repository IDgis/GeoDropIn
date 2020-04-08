#!/bin/bash

set -e

curl -sL "https://install.meteor.com/?release=1.4.2.3" | sed s/--progress-bar/-sL/g | /bin/sh
