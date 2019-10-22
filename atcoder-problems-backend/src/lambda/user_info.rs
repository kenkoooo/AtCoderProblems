use super::{LambdaInput, LambdaOutput};
use crate::error::Result;
use crate::sql::{AcceptedCountClient, RatedPointSumClient};

use diesel::{Connection, ConnectionResult, PgConnection};
use lambda_runtime::{error::HandlerError, Context, Handler};
use log::info;
use serde::Serialize;

fn get_user_info<'a, C>(conn: &C, user_id: &'a str) -> Result<UserInfo<'a>>
where
    C: AcceptedCountClient + RatedPointSumClient,
{
    let accepted_count = conn.get_users_accepted_count(user_id)?;
    let accepted_count_rank = conn.get_accepted_count_rank(accepted_count)?;
    let rated_point_sum = conn.get_users_rated_point_sum(user_id)?;
    let rated_point_sum_rank = conn.get_rated_point_sum_rank(rated_point_sum)?;
    Ok(UserInfo {
        user_id,
        accepted_count,
        accepted_count_rank,
        rated_point_sum,
        rated_point_sum_rank,
    })
}

#[derive(Serialize)]
struct UserInfo<'a> {
    user_id: &'a str,
    accepted_count: i32,
    accepted_count_rank: i64,
    rated_point_sum: f64,
    rated_point_sum_rank: i64,
}

pub struct UserInfoHandler<C> {
    connection: C,
}

impl UserInfoHandler<PgConnection> {
    pub fn new(url: &str) -> ConnectionResult<Self> {
        let connection = PgConnection::establish(&url)?;
        Ok(Self { connection })
    }
}

impl<C> Handler<LambdaInput, LambdaOutput, HandlerError> for UserInfoHandler<C>
where
    C: AcceptedCountClient + RatedPointSumClient,
{
    fn run(
        &mut self,
        e: LambdaInput,
        _: Context,
    ) -> std::result::Result<LambdaOutput, HandlerError> {
        let user_id = e
            .param("user")
            .ok_or_else(|| HandlerError::from("There is no user."))?;

        info!("UserInfo API");
        let user_info = get_user_info(&self.connection, user_id)?;

        let body = serde_json::to_string(&user_info)?;
        Ok(LambdaOutput::new200(body, None))
    }
}
