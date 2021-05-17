use anyhow::Result;

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

    pub fn fetch_data(&self, path: &str) -> Vec<u8> {
        self.bucket
            .get_object(path)
            .map(|(data, _)| data)
            .unwrap_or_else(|e| {
                log::error!("{:?}", e);
                Vec::new()
            })
    }

    pub fn update(&self, data: Vec<u8>, path: &str) -> Result<bool> {
        log::info!("Fetching old data ...");
        let old_data = self.fetch_data(path);
        if old_data != data {
            log::info!("Uploading new data to {} ...", path);
            let (data, status) =
                self.bucket
                    .put_object(path, &data, "application/json;charset=utf-8")?;
            log::info!("data={:?}", data);
            log::info!("status={}", status);
            Ok(true)
        } else {
            log::info!("No update on {}", path);
            Ok(false)
        }
    }
}
