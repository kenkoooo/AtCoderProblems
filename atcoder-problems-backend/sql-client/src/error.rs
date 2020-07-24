use std::fmt;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SqlClientError {
    #[error("{0}")]
    Sql(#[from] sqlx::Error),
    #[error("The number of {0} is exceeded.")]
    LimitExceeded(EntityKind),
    #[error("No {0} is found.")]
    RecordNotFound(EntityKind),
}

#[derive(Debug)]
pub enum EntityKind {
    ListItem,
    List,
}

impl fmt::Display for EntityKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        use EntityKind::*;
        write!(
            f,
            "{}",
            match *self {
                ListItem => "ListItem",
                List => "List",
            }
        )
    }
}
