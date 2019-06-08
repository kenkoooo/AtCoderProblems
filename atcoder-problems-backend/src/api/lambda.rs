use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
pub enum LambdaRequest<'a> {
    UserSubmission { user_id: &'a str },
    TimeSubmission { from_epoch_second: i64 },
    UserInfo { user_id: &'a str },
}

impl LambdaInput {
    pub fn request(&self) -> Option<LambdaRequest> {
        let path = self.path_parameters.path.as_str();
        let params = &self.query_string_parameters;
        match path {
            "results" => {
                let user = params
                    .user
                    .as_ref()
                    .map(|user_id| LambdaRequest::UserSubmission { user_id: user_id });
                let from = params
                    .from
                    .as_ref()
                    .and_then(|from| from.parse::<i64>().ok())
                    .map(|from_epoch_second| LambdaRequest::TimeSubmission { from_epoch_second });
                user.or(from)
            }
            "v2/user_info" => params
                .user
                .as_ref()
                .map(|user_id| LambdaRequest::UserInfo { user_id: user_id }),
            _ => unreachable!(),
        }
    }

    pub fn header(&self, field: &str) -> Option<&str> {
        self.headers
            .iter()
            .find(|(key, _)| key.to_ascii_lowercase() == field.to_ascii_lowercase())
            .map(|(_, value)| value.as_str())
    }
}

#[derive(Serialize, Clone)]
pub struct LambdaOutput {
    #[serde(rename = "isBase64Encoded")]
    is_base64_encoded: bool,
    #[serde(rename = "statusCode")]
    status_code: u32,
    body: String,
    headers: HashMap<String, String>,
}

impl LambdaOutput {
    pub fn new200(body: String, headers: HashMap<String, String>) -> Self {
        Self {
            is_base64_encoded: false,
            status_code: 200,
            body,
            headers,
        }
    }

    pub fn new304(headers: HashMap<String, String>) -> Self {
        Self {
            is_base64_encoded: false,
            status_code: 304,
            body: String::new(),
            headers,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lambda_input() {
        assert_eq!(
            serde_json::from_str::<LambdaInput>(
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
            .request()
            .unwrap(),
            LambdaRequest::UserSubmission {
                user_id: "kenkoooo"
            }
        );

        assert_eq!(
            serde_json::from_str::<LambdaInput>(
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
            .request()
            .unwrap(),
            LambdaRequest::UserSubmission {
                user_id: "kenkoooo"
            }
        );

        assert_eq!(
            serde_json::from_str::<LambdaInput>(
                r#"{
            "pathParameters": {
                "proxy": "results"
            },
            "queryStringParameters": {
                "from": "1"
            },
            "headers": {}
        }"#,
            )
            .unwrap()
            .request()
            .unwrap(),
            LambdaRequest::TimeSubmission {
                from_epoch_second: 1
            }
        );

        assert_eq!(
            serde_json::from_str::<LambdaInput>(
                r#"{
            "pathParameters": {
                "proxy": "v2/user_info"
            },
            "queryStringParameters": {
                "user": "kenkoooo"
            },
            "headers": {}
        }"#,
            )
            .unwrap()
            .request()
            .unwrap(),
            LambdaRequest::UserInfo {
                user_id: "kenkoooo"
            }
        );
    }
}
