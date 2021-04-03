use log::LevelFilter;
use simple_logger::SimpleLogger;

use anyhow::Result;

pub fn init_log_config() -> Result<()> {
    SimpleLogger::new()
        .with_level(LevelFilter::Info)
        .with_module_level("sqlx", LevelFilter::Warn)
        .with_module_level("tide", LevelFilter::Warn)
        .with_module_level("surf", LevelFilter::Warn)
        .init()?;
    Ok(())
}
