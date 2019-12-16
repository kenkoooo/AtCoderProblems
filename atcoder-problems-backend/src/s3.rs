use crate::error::Result;

use s3::bucket::Bucket;
use s3::credentials::Credentials;

const BUCKET_NAME: &str = "kenkoooo.com";
const REGION: &str = "ap-northeast-1";

pub struct S3Client {
    bucket: Bucket,
}

impl S3Client {
    pub fn new() -> Result<Self> {
        let region = REGION.parse()?;
        let credentials = Credentials::default();
        let bucket = Bucket::new(BUCKET_NAME, region, credentials)?;
        Ok(Self { bucket })
    }

    pub fn update(&self, data: Vec<u8>, path: &str) -> Result<bool> {
        let old_data = self
            .bucket
            .get_object(path)
            .ok()
            .map(|(data, _)| data)
            .unwrap_or_else(Vec::new);
        if old_data != data {
            self.bucket
                .put_object(path, &data, "application/json;charset=utf-8")?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}
