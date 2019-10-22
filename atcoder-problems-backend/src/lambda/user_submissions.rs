use super::{LambdaInput, LambdaOutput};
use crate::sql::{SubmissionClient, SubmissionRequest};

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
        let count: i64 = self.connection.get_user_submission_count(user_id)?;

        let mut hasher = Md5::new();
        hasher.input(user_id.as_bytes());
        hasher.input(b" ");
        hasher.input(count.to_be_bytes());
        let etag = hex::encode(hasher.result());

        match e.header("If-None-Match") {
            Some(tag) if tag == etag => Ok(LambdaOutput::new304()),
            _ => {
                let submissions = self
                    .connection
                    .get_submissions(SubmissionRequest::UserAll { user_id })?;
                let body = serde_json::to_string(&submissions)?;
                Ok(LambdaOutput::new200(body, Some(etag)))
            }
        }
    }
}
