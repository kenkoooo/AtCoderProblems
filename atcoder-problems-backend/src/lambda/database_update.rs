use crate::error::MapHandlerError;
use crate::sql::models::Submission;
use crate::sql::{
    AcceptedCountClient, LanguageCountClient, ProblemInfoUpdater, ProblemsSubmissionUpdater,
    RatedPointSumClient, SubmissionClient, SubmissionRequest,
};
use diesel::{Connection, ConnectionResult, PgConnection};
use lambda_runtime::{error::HandlerError, Context, Handler};
use log::info;

pub struct DatabaseUpdateHandler<C> {
    connection: C,
}

impl DatabaseUpdateHandler<PgConnection> {
    pub fn new(url: &str) -> ConnectionResult<Self> {
        let connection = PgConnection::establish(&url)?;
        Ok(Self { connection })
    }
}

impl<C> Handler<String, String, HandlerError> for DatabaseUpdateHandler<C>
where
    C: AcceptedCountClient
        + LanguageCountClient
        + ProblemsSubmissionUpdater
        + RatedPointSumClient
        + SubmissionClient
        + ProblemInfoUpdater,
{
    fn run(&mut self, _: String, _: Context) -> Result<String, HandlerError> {
        let submissions: Vec<Submission> = self
            .connection
            .get_submissions(SubmissionRequest::AllAccepted)
            .map_handler_error()?;

        info!("There are {} AC submissions.", submissions.len());

        info!("Executing update_accepted_count...");
        self.connection
            .update_accepted_count(&submissions)
            .map_handler_error()?;

        info!("Executing update_problem_solver_count...");
        self.connection.update_solver_count().map_handler_error()?;

        info!("Executing update_rated_point_sums...");
        self.connection
            .update_rated_point_sum(&submissions)
            .map_handler_error()?;

        info!("Executing update_language_count...");
        self.connection
            .update_language_count(&submissions)
            .map_handler_error()?;

        info!("Executing update_submissions_of_problems...");
        self.connection
            .update_submissions_of_problems(&submissions)
            .map_handler_error()?;

        info!("Executing update_problem_points...");
        self.connection
            .update_problem_points()
            .map_handler_error()?;

        Ok("Finished".to_owned())
    }
}
