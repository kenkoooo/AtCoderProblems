use crate::sql::models::Performance;
use reqwest;
use serde::Deserialize;
use std::collections::BTreeMap;

const ATCODER_HOST: &str = "https://atcoder.jp";

pub trait ScraperTrait {
    fn scrape_performances(&self, contest_id: &str) -> Option<Vec<Performance>>;
}

pub struct Scraper;

impl ScraperTrait for Scraper {
    fn scrape_performances(&self, contest_id: &str) -> Option<Vec<Performance>> {
        #[derive(Deserialize, Debug, Clone)]
        struct ContestPerformance {
            #[serde(rename = "Place")]
            place: u64,

            #[serde(rename = "Performance")]
            inner_performance: i64,
        }

        #[derive(Deserialize, Debug, Clone)]
        struct ContestStandings {
            #[serde(rename = "StandingsData")]
            standings: Vec<ContestStanding>,
        }

        #[derive(Deserialize, Debug, Clone)]
        struct ContestStanding {
            #[serde(rename = "Rank")]
            place: u64,

            #[serde(rename = "UserScreenName")]
            user_id: String,
        }

        let url = format!("{}/contests/{}/standings/json", ATCODER_HOST, contest_id);
        let standings = reqwest::get(&url)
            .ok()?
            .json::<ContestStandings>()
            .ok()?
            .standings
            .into_iter()
            .map(|s| (s.place, s.user_id))
            .collect::<BTreeMap<_, _>>();

        let url = format!("{}/contests/{}/results/json", ATCODER_HOST, contest_id);
        let performances = reqwest::get(&url)
            .ok()?
            .json::<Vec<ContestPerformance>>()
            .ok()?
            .into_iter()
            .filter_map(|p| {
                standings.get(&p.place).map(|user_id| Performance {
                    inner_performance: p.inner_performance,
                    user_id: user_id.to_string(),
                    contest_id: contest_id.to_string(),
                })
            })
            .collect::<Vec<_>>();
        Some(performances)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scrape_performances() {
        let contest_id = "soundhound2018-summer-qual";
        let scraper = Scraper;
        let performances = scraper.scrape_performances(contest_id).unwrap();
        assert_eq!(performances.len(), 1852);
    }
}
