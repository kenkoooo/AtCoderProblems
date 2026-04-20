use std::sync::Arc;

use sea_orm::DatabaseConnection;

use super::auth::GithubAuthenticator;

#[derive(Clone)]
pub struct AppState {
    pub(crate) db: DatabaseConnection,
    pub(crate) github: Arc<dyn GithubAuthenticator>,
}

impl AppState {
    pub fn new(db: DatabaseConnection, github: Arc<dyn GithubAuthenticator>) -> Self {
        Self { db, github }
    }
}
