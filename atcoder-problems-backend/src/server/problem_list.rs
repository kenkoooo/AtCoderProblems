use crate::error::Result;
use crate::server::{AppData, Authentication, CommonRequest, CommonResponse, PooledConnection};
use crate::sql::internal::problem_list_manager::ProblemListManager;
use tide::{Request, Response};

pub(crate) async fn get_list<A: Clone + Authentication>(request: Request<AppData<A>>) -> Response {
    let client = request.state().authentication.clone();
    match unwrap_request(request) {
        Ok((token, conn, internal_user_id)) => {
            let is_valid = client.validate_token(&token).await;
            if is_valid {
                match construct_response(conn, internal_user_id) {
                    Ok(response) => response,
                    _ => Response::internal_error(),
                }
            } else {
                Response::bad_request()
            }
        }
        Err(_) => Response::bad_request(),
    }
}

fn unwrap_request<A>(request: Request<AppData<A>>) -> Result<(String, PooledConnection, String)> {
    let token = request.get_cookie("token")?;
    let conn = request.state().pool.get()?;
    let internal_user_id = request.param::<String>("internal_user_id")?;
    Ok((token, conn, internal_user_id))
}

fn construct_response(conn: PooledConnection, internal_user_id: String) -> Result<Response> {
    let list = conn.get_list(&internal_user_id)?;
    let response = Response::ok().body_json(&list)?;
    Ok(response)
}
