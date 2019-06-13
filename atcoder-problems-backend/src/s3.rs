use rusoto_core::{ByteStream, Region};
use rusoto_s3;
use rusoto_s3::{GetObjectRequest, PutObjectRequest, S3};
use std::io::prelude::*;

const BUCKET_NAME: &str = "kenkoooo.com";

pub enum ContentType {
    Json,
    Png,
    Other,
}

impl ContentType {
    fn get(self) -> Option<String> {
        match self {
            ContentType::Json => Some("application/json;charset=utf-8".to_string()),
            ContentType::Png => Some("image/png".to_string()),
            ContentType::Other => None,
        }
    }
}

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

    pub fn update(
        &self,
        data: Vec<u8>,
        path: &str,
        content_type: ContentType,
    ) -> Result<bool, &str> {
        let mut get_request = GetObjectRequest::default();
        get_request.bucket = String::from(BUCKET_NAME);
        get_request.key = String::from(path);

        let old_data = self
            .client
            .get_object(get_request)
            .sync()
            .ok()
            .and_then(|object| object.body)
            .and_then(|stream| {
                let mut buffer = Vec::new();
                stream.into_blocking_read().read_to_end(&mut buffer).ok()?;
                Some(buffer)
            })
            .unwrap_or_else(Vec::new);
        if old_data != data {
            let mut request = PutObjectRequest::default();
            request.bucket = String::from(BUCKET_NAME);
            request.key = String::from(path);
            request.body = Some(ByteStream::from(data));
            request.content_type = content_type.get();
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
