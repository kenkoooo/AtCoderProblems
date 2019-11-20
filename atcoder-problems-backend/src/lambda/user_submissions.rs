use super::{LambdaInput, LambdaOutput};
use crate::sql::{SubmissionClient, SubmissionRequest};

use crate::sql::models::Submission;
use diesel::{Connection, ConnectionResult, PgConnection};
use lambda_runtime::{error::HandlerError, Context, Handler};
use log::info;
use md5::{Digest, Md5};

pub struct UserSubmissionsHandler<C> {
    connection: C,
}

impl UserSubmissionsHandler<PgConnection> {
    pub fn new(url: &str) -> ConnectionResult<Self> {
        let connection = PgConnection::establish(&url)?;
        Ok(Self { connection })
    }
}

impl<C> Handler<LambdaInput, LambdaOutput, HandlerError> for UserSubmissionsHandler<C>
where
    C: SubmissionClient,
{
    fn run(&mut self, e: LambdaInput, _: Context) -> Result<LambdaOutput, HandlerError> {
        info!("User Submission API: {:?}", e);

        let user_id = e
            .param("user")
            .ok_or_else(|| HandlerError::from("There is no user."))?;
        if let Some(etag) = e.header("If-None-Match") {
            let lite_count: i64 = self.connection.get_user_submission_count(user_id)?;
            let lite_etag = calc_etag(user_id, lite_count as usize);
            if lite_etag.as_str() == etag {
                return Ok(LambdaOutput::new304());
            }

            let submissions = self
                .connection
                .get_submissions(SubmissionRequest::UserAll { user_id })?;
            let heavy_count = submissions.len();
            let heavy_etag = calc_etag(user_id, heavy_count);
            if heavy_etag.as_str() == etag {
                Ok(LambdaOutput::new304())
            } else {
                let body = serde_json::to_string(&submissions)?;
                Ok(LambdaOutput::new200(body, Some(heavy_etag)))
            }
        } else {
            let submissions = self
                .connection
                .get_submissions(SubmissionRequest::UserAll { user_id })?;
            let heavy_count = submissions.len();
            let heavy_etag = calc_etag(user_id, heavy_count);
            let body = serde_json::to_string(&submissions)?;
            Ok(LambdaOutput::new200(body, Some(heavy_etag)))
        }
    }
}

fn calc_etag(user_id: &str, count: usize) -> String {
    let mut hasher = Md5::new();
    hasher.input(user_id.as_bytes());
    hasher.input(b" ");
    hasher.input(count.to_be_bytes());
    hex::encode(hasher.result())
}
