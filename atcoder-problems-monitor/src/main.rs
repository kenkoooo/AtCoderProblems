use base64;
use lambda_runtime::{error::HandlerError, lambda, Context};
use log::{self, info};
use openssl_probe;
use rusoto_cloudwatch::{CloudWatch, CloudWatchClient, GetMetricWidgetImageInput};
use rusoto_core::{ByteStream, Region};
use rusoto_s3;
use rusoto_s3::{PutObjectRequest, S3};
use serde::Serialize;
use serde_json;
use simple_logger;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    openssl_probe::init_ssl_cert_env_vars();
    lambda!(handler);
    Ok(())
}

fn handler(_: String, _: Context) -> Result<(), HandlerError> {
    info!("Loading CloudWatch logs...");
    let client = CloudWatchClient::new(Region::ApNortheast1);
    let metrics = MetricWidget {
        metrics: vec![vec![
            "AWS/EBS",
            "BurstBalance",
            "VolumeId",
            "vol-034640312c7427ebb",
        ]],
        timezone: "+0900",
        start: "-P10D",
        title: "Remaining BurstBalance of PostgreSQL",
    };
    let metric_widget = serde_json::to_string(&metrics)?;
    let input = GetMetricWidgetImageInput {
        metric_widget,
        output_format: Some("png".to_owned()),
    };
    let encoded = client
        .get_metric_widget_image(input)
        .sync()
        .map_err(|e| HandlerError::from(e.to_string().as_str()))?
        .metric_widget_image
        .ok_or(HandlerError::from(""))?;
    let bytes = base64::decode(&encoded).map_err(|e| HandlerError::from(e.to_string().as_str()))?;

    info!("Uploading to S3...");
    let client = rusoto_s3::S3Client::new(Region::ApNortheast1);
    let mut request = PutObjectRequest::default();
    request.bucket = String::from("kenkoooo.com");
    request.key = String::from("monitor/postgresql-ebs.png");
    request.body = Some(ByteStream::from(bytes));
    request.content_type = Some(String::from("image/png"));
    client
        .put_object(request)
        .sync()
        .map_err(|e| HandlerError::from(e.to_string().as_str()))?;

    info!("Done");
    Ok(())
}

#[derive(Serialize)]
struct MetricWidget<S>
    where
        S: Serialize,
{
    metrics: Vec<Vec<S>>,
    timezone: S,
    start: S,
    title: S,
}
