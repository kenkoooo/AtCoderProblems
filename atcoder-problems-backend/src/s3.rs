use rusoto_core::{ByteStream, Region};
use rusoto_s3;
use rusoto_s3::{GetObjectRequest, PutObjectRequest, S3};
use serde::Serialize;
use std::io::prelude::*;

const BUCKET_NAME: &str = "kenkoooo.com";

pub struct S3Client {
    client: rusoto_s3::S3Client,
}

impl Default for S3Client {
    fn default() -> Self {
        Self {
            client: rusoto_s3::S3Client::new(Region::ApNortheast1),
        }
    }
}

impl S3Client {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn update<T>(&self, new_vec: Vec<T>, path: &str) -> Result<bool, &str>
    where
        T: Serialize,
    {
        let mut get_request = GetObjectRequest::default();
        get_request.bucket = String::from(BUCKET_NAME);
        get_request.key = String::from(path);

        let old_string = self
            .client
            .get_object(get_request)
            .sync()
            .ok()
            .and_then(|object| object.body)
            .and_then(|stream| {
                let mut old_string = String::new();
                stream
                    .into_blocking_read()
                    .read_to_string(&mut old_string)
                    .ok();
                Some(old_string)
            })
            .unwrap_or_else(String::new);

        let new_string = serde_json::to_string(&new_vec).map_err(|_| "Failed to serialize.")?;

        if old_string != new_string {
            let mut request = PutObjectRequest::default();
            request.bucket = String::from("kenkoooo.com");
            request.key = String::from(path);
            request.body = Some(ByteStream::from(new_string.as_bytes().to_vec()));
            request.content_type = Some(String::from("application/json;charset=utf-8"));
            self.client
                .put_object(request)
                .sync()
                .map_err(|_| "Failed to upload")?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}
