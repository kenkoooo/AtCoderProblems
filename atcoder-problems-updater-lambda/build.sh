#!/bin/sh

cargo build --release --target x86_64-unknown-linux-musl

mv ./target/x86_64-unknown-linux-musl/release/update /tmp/bootstrap
zip -j target/update.zip /tmp/bootstrap

mv ./target/x86_64-unknown-linux-musl/release/delta_update /tmp/bootstrap
zip -j target/delta_update.zip /tmp/bootstrap
