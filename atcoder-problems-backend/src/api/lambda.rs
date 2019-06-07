use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;

#[derive(Serialize, Clone)]
struct CustomOutput {
    #[serde(rename = "isBase64Encoded")]
    is_base64_encoded: bool,
    #[serde(rename = "statusCode")]
    status_code: u32,
    body: String,
    headers: HashMap<String, String>,
}

#[derive(Serialize)]
struct UserInfo {
    user_id: String,
    accepted_count: i32,
    accepted_count_rank: i64,
    rated_point_sum: f64,
    rated_point_sum_rank: i64,
}

#[derive(Deserialize, Debug, Eq, PartialEq)]
pub struct LambdaInput {
    #[serde(rename = "pathParameters")]
    path_parameters: LambdaInputPathParameters,

    #[serde(rename = "queryStringParameters")]
    query_string_parameters: LambdaInputQueryParameters,

    headers: HashMap<String, String>,
}

#[derive(Deserialize, Debug, Eq, PartialEq)]
struct LambdaInputPathParameters {
    #[serde(rename = "proxy")]
    path: String,
}

#[derive(Deserialize, Debug, Eq, PartialEq)]
struct LambdaInputQueryParameters {
    user: Option<String>,
    from: Option<String>,
}

#[derive(Deserialize, Debug, Eq, PartialEq)]
pub enum LambdaRequest {
    UserSubmission { user_id: String },
    TimeSubmission { from_epoch_second: i64 },
    UserInfo { user_id: String },
}

impl LambdaInput {
    pub fn request(self) -> Option<LambdaRequest> {
        let path = self.path_parameters.path;
        let params = self.query_string_parameters;
        match path.as_str() {
            "results" => {
                let user = params
                    .user
                    .map(|user_id| LambdaRequest::UserSubmission { user_id });
                let from = params
                    .from
                    .and_then(|from| from.parse::<i64>().ok())
                    .map(|from_epoch_second| LambdaRequest::TimeSubmission { from_epoch_second });
                user.or(from)
            }
            "v2/user_info" => params
                .user
                .map(|user_id| LambdaRequest::UserInfo { user_id }),
            _ => unreachable!(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lambda_input() {
        let input = serde_json::from_str::<LambdaInput>(
            r#"{
            "pathParameters": {
                "proxy": "results"
            },
            "queryStringParameters": {
                "user": "kenkoooo"
            },
            "headers": {}
        }"#,
        )
        .unwrap()
        .request();
        assert!(false, "{:?}", input);
    }
}
