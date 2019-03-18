#!/bin/sh

cargo build --release --target x86_64-unknown-linux-musl
zip -j target/rust.zip ./target/x86_64-unknown-linux-musl/release/bootstrap
