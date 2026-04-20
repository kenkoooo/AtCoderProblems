use axum::{Json, extract::State};

use crate::server::{AppState, ServerResult};
use server_db as db;

pub(crate) async fn get_language_list(
    State(state): State<AppState>,
) -> ServerResult<Json<Vec<String>>> {
    let languages = db::ranking::load_languages(&state.db).await?;
    Ok(Json(languages))
}
