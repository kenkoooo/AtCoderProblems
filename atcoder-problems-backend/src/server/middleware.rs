use futures::future::BoxFuture;
use log::info;
use tide::{Middleware, Next, Request, Response};

#[derive(Debug, Clone, Default)]
pub(crate) struct RequestLogger;

impl RequestLogger {
    pub(crate) fn new() -> Self {
        Self::default()
    }

    async fn log_basic<'a, State: Send + Sync + 'static>(
        &'a self,
        req: Request<State>,
        next: Next<'a, State>,
    ) -> Response {
        let uri = req.uri().to_string();
        let method = req.method().as_str().to_owned();
        let start = std::time::Instant::now();
        let user_agent = req.header("user-agent").unwrap_or_else(|| "").to_string();
        let res = next.run(req).await;
        let status = res.status();
        info!(
            "{} {} {} \"{}\" {}ms",
            method,
            uri,
            status.as_str(),
            user_agent,
            start.elapsed().as_millis()
        );
        res
    }
}

impl<State: Send + Sync + 'static> Middleware<State> for RequestLogger {
    fn handle<'a>(&'a self, req: Request<State>, next: Next<'a, State>) -> BoxFuture<'a, Response> {
        Box::pin(async move { self.log_basic(req, next).await })
    }
}
