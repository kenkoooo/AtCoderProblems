use futures::future::BoxFuture;
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
        let path = req.uri().path().to_owned();
        let method = req.method().as_str().to_owned();
        log::trace!("IN => {} {}", method, path);
        let start = std::time::Instant::now();
        let res = next.run(req).await;
        let status = res.status();
        log::info!(
            "{} {} {} {}ms",
            method,
            path,
            status.as_str(),
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
