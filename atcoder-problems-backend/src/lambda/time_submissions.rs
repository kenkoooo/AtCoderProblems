use super::{LambdaInput, LambdaOutput};
use crate::error::MapHandlerError;
use crate::sql::{SubmissionClient, SubmissionRequest};

use diesel::{Connection, ConnectionResult, PgConnection};
use lambda_runtime::{error::HandlerError, Context, Handler};
use log::info;
use md5::{Digest, Md5};

pub struct TimeSubmissionsHandler<C> {
    connection: C,
}

impl TimeSubmissionsHandler<PgConnection> {
    pub fn new(url: &str) -> ConnectionResult<Self> {
        let connection = PgConnection::establish(&url)?;
        Ok(Self { connection })
    }
}

impl<C> Handler<LambdaInput, LambdaOutput, HandlerError> for TimeSubmissionsHandler<C>
where
    C: SubmissionClient,
{
    fn run(&mut self, e: LambdaInput, _: Context) -> Result<LambdaOutput, HandlerError> {
        info!("Time Submission API: {:?}", e);

        let from_epoch_second = e
            .path("time")
            .ok_or_else(|| HandlerError::from("There is no time."))?
            .parse::<i64>()?;
        let submissions: Vec<_> = self
            .connection
            .get_submissions(SubmissionRequest::FromTime {
                from_second: from_epoch_second,
                count: 1000,
            })
            .herr()?;
        let max_id = submissions.iter().map(|s| s.id).max().unwrap_or(0);

        let mut hasher = Md5::new();
        hasher.input(from_epoch_second.to_be_bytes());
        hasher.input(b" ");
        hasher.input(max_id.to_be_bytes());
        let etag = hex::encode(hasher.result());

        match e.header("If-None-Match") {
            Some(tag) if tag == etag => Ok(LambdaOutput::new304()),
            _ => {
                let body = serde_json::to_string(&submissions)?;
                Ok(LambdaOutput::new200(body, Some(etag)))
            }
        }
    }
}
