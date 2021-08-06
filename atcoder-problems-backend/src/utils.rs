use log::LevelFilter;
use simple_logger::SimpleLogger;

use anyhow::Result;

pub const Excluded_Users: [&str; 17] = [
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
    SimpleLogger::new()
        .with_level(LevelFilter::Info)
        .with_module_level("sqlx", LevelFilter::Warn)
        .with_module_level("tide", LevelFilter::Warn)
        .with_module_level("surf", LevelFilter::Warn)
        .init()?;
    Ok(())
}
