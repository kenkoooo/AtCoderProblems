use aws_config::BehaviorVersion;
use aws_sdk_s3::Client;
use bytes::Bytes;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum S3Error {
    #[error("AWS SDK get object error: {0}")]
    GetObject(
        #[from] aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::get_object::GetObjectError>,
    ),

    #[error("AWS SDK put object error: {0}")]
    PutObject(
        #[from] aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::put_object::PutObjectError>,
    ),

    #[error("Body collect error: {0}")]
    BodyCollect(#[from] aws_sdk_s3::primitives::ByteStreamError),
}

pub type Result<T> = std::result::Result<T, S3Error>;

pub struct S3Client {
    client: Client,
    bucket: String,
}

impl S3Client {
    pub async fn new(bucket: &str) -> Self {
        let region = aws_sdk_s3::config::Region::new("ap-northeast-1");
        let config_loader = aws_config::defaults(BehaviorVersion::latest()).region(region);
        let config = config_loader.load().await;
        let client = Client::new(&config);
        Self {
            client,
            bucket: bucket.to_string(),
        }
    }

    pub fn with_client(client: Client, bucket: &str) -> Self {
        Self {
            client,
            bucket: bucket.to_string(),
        }
    }

    pub async fn put_object(&self, key: &str, data: impl Into<Bytes>) -> Result<()> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(data.into().into())
            .send()
            .await?;

        Ok(())
    }

    pub async fn put_object_with_content_type(
        &self,
        key: &str,
        data: impl Into<Bytes>,
        content_type: &str,
    ) -> Result<()> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .content_type(content_type)
            .body(data.into().into())
            .send()
            .await?;

        Ok(())
    }

    /// Update object only if data has changed
    pub async fn update(&self, key: &str, data: Vec<u8>) -> Result<bool> {
        let old_data = self.get_object(key).await?.map(|b| b.to_vec());

        if old_data.as_ref() != Some(&data) {
            self.put_object_with_content_type(key, data, "application/json;charset=utf-8")
                .await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn get_object(&self, key: &str) -> Result<Option<Bytes>> {
        let response = match self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
        {
            Ok(resp) => resp,
            Err(err) => {
                if let aws_sdk_s3::error::SdkError::ServiceError(service_err) = &err {
                    if service_err.err().is_no_such_key() {
                        return Ok(None);
                    }
                }
                return Err(S3Error::GetObject(err));
            }
        };

        let data = response.body.collect().await?.into_bytes();
        Ok(Some(data))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aws_config::Region;
    use aws_sdk_s3::types::CreateBucketConfiguration;
    use testcontainers_modules::testcontainers::ImageExt;
    use testcontainers_modules::{localstack, testcontainers::runners::AsyncRunner};

    #[tokio::test]
    async fn test_put_and_get_object() {
        // Arrange
        let container = localstack::LocalStack::default()
            .with_env_var("SERVICES", "s3")
            .start()
            .await
            .expect("Failed to start LocalStack container");

        let host_ip = container.get_host().await.unwrap();
        let host_port = container.get_host_port_ipv4(4566).await.unwrap();
        let endpoint_url = format!("http://{host_ip}:{host_port}");
        let credentials = aws_sdk_s3::config::Credentials::new("fake", "fake", None, None, "test");
        let client = aws_sdk_s3::Client::from_conf(
            aws_sdk_s3::config::Builder::default()
                .behavior_version_latest()
                .region(Region::new("ap-northeast-1"))
                .credentials_provider(credentials)
                .endpoint_url(endpoint_url)
                .force_path_style(true)
                .build(),
        );

        let bucket_name = "test-bucket";

        client
            .create_bucket()
            .create_bucket_configuration(
                CreateBucketConfiguration::builder()
                    .location_constraint("ap-northeast-1".into())
                    .build(),
            )
            .bucket(bucket_name)
            .send()
            .await
            .unwrap();

        let client = S3Client::with_client(client, bucket_name);

        // Act
        let test_key = "testfile.txt";
        let test_data = "Hello, S3!";

        client
            .put_object(&test_key, test_data.as_bytes())
            .await
            .unwrap();

        // Assert
        let result = client.get_object(&test_key).await.unwrap();
        assert!(result.is_some());

        let data = result.unwrap();
        assert_eq!(data, Bytes::from(test_data));
    }
}
