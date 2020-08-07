use async_trait::async_trait;
use serde_json::json;

#[derive(Debug, Default, Clone)]
pub struct LogMiddleware;

struct LogMiddlewareHasBeenRun;

impl LogMiddleware {
    async fn log<'a, State>(
        &'a self,
        mut req: tide::Request<State>,
        next: tide::Next<'a, State>,
    ) -> tide::Result
    where
        State: Clone + Send + Sync + 'static,
    {
        if req.ext::<LogMiddlewareHasBeenRun>().is_some() {
            return Ok(next.run(req).await);
        }
        req.set_ext(LogMiddlewareHasBeenRun);

        let url = req.url().to_string();
        let method = req.method().to_string();
        let start = std::time::Instant::now();
        let response = next.run(req).await;
        let duration_millis = (start.elapsed().as_millis() as f64) / 1000.0;
        let status = response.status();

        log::info!(
            "{}",
            json!({
                "method": method,
                "url": url,
                "status": status as u16,
                "duration": duration_millis,
            })
            .to_string()
        );
        Ok(response)
    }
}

#[async_trait]
impl<State> tide::Middleware<State> for LogMiddleware
where
    State: Clone + Send + Sync + 'static,
{
    async fn handle(&self, req: tide::Request<State>, next: tide::Next<'_, State>) -> tide::Result {
        self.log(req, next).await
    }
}
