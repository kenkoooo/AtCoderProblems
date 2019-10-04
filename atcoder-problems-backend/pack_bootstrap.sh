#!/bin/sh -x

for f in `ls src/bin/lambda_*`
do
    BIN_NAME=`basename ${f} .rs`
    BIN_PATH="target/x86_64-unknown-linux-musl/release/${BIN_NAME}"
    mv ${BIN_PATH} ./bootstrap
    zip -r ${BIN_NAME}.zip ./bootstrap
    rm ./bootstrap
done
