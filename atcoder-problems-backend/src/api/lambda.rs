use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Deserialize, Debug, Eq, PartialEq)]
pub struct LambdaInput {
    #[serde(rename = "queryStringParameters")]
    params: Option<HashMap<String, String>>,

    #[serde(rename = "pathParameters")]
    paths: Option<HashMap<String, String>>,

    headers: Option<HashMap<String, String>>,
}

impl LambdaInput {
    pub fn param(&self, field: &str) -> Option<&str> {
        self.params.as_ref()?.get(field).map(|v| v.as_str())
    }

    pub fn path(&self, field: &str) -> Option<&str> {
        self.paths.as_ref()?.get(field).map(|v| v.as_str())
    }

    pub fn header(&self, field: &str) -> Option<&str> {
        self.headers
            .as_ref()?
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
    pub fn new200(body: String, etag: Option<String>) -> Self {
        let mut headers = HashMap::new();
        headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());
        if let Some(etag) = etag {
            headers.insert("etag".to_owned(), etag);
        }
        Self {
            is_base64_encoded: false,
            status_code: 200,
            body,
            headers,
        }
    }

    pub fn new304() -> Self {
        let mut headers = HashMap::new();
        headers.insert("Access-Control-Allow-Origin".to_owned(), "*".to_owned());
        Self {
            is_base64_encoded: false,
            status_code: 304,
            body: String::new(),
            headers,
        }
    }
}
