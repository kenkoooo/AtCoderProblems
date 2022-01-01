use fern;
use log::LevelFilter;

use anyhow::Result;

pub const EXCLUDED_USERS: [&str; 17] = [
    "vjudge1",
    "vjudge2",
    "vjudge3",
    "vjudge4",
    "vjudge5",
    "luogu__bot1",
    "luogu__bot2",
    "luogu__bot4",
    "luogu__bot5",
    "luogu_bot",
    "luogu_bot0",
    "luogu_bot1",
    "luogu_bot2",
    "luogu_bot3",
    "luogu_bot4",
    "luogu_bot5",
    "luogu_bot6",
];

pub fn init_log_config() -> Result<()> {
    fern::Dispatch::new()
        .format(|out, message, _record| out.finish(format_args!("{}", message)))
        .level(LevelFilter::Info)
        .level_for("sqlx", LevelFilter::Warn)
        .level_for("actix_web", LevelFilter::Warn)
        .level_for("reqwest", LevelFilter::Warn)
        .chain(std::io::stdout())
        .apply()?;
    Ok(())
}
