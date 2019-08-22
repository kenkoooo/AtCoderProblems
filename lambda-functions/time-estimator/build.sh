#!/usr/bin/env bash

set -xue

TEMP_DIR=__build_$(date +%s)
mkdir ${TEMP_DIR}
pip install requests -t ${TEMP_DIR}
cp function.py ${TEMP_DIR}/
cd ${TEMP_DIR} && zip -r ../function.zip *
cd ../
rm -r ${TEMP_DIR}
