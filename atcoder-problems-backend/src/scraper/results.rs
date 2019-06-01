use crate::scraper::ATCODER_HOST;
use crate::sql::models::Performance;
use reqwest;
use serde::Deserialize;
use std::collections::BTreeMap;

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

fn get_standings(contest_id: &str) -> reqwest::Result<Vec<ContestStanding>> {
    let url = format!("{}/contests/{}/standings/json", ATCODER_HOST, contest_id);
    reqwest::get(&url)
        .and_then(|mut response| response.json::<ContestStandings>())
        .map(|standings| standings.standings)
}

fn get_contest_performances(contest_id: &str) -> reqwest::Result<Vec<ContestPerformance>> {
    let url = format!("{}/contests/{}/results/json", ATCODER_HOST, contest_id);
    reqwest::get(&url).and_then(|mut response| response.json())
}

pub fn get_performances(contest_id: &str) -> reqwest::Result<Vec<Performance>> {
    let standings = get_standings(contest_id)?
        .into_iter()
        .map(|s| (s.place, s.user_id))
        .collect::<BTreeMap<_, _>>();
    let performances = get_contest_performances(contest_id)?
        .into_iter()
        .filter_map(|p| {
            standings.get(&p.place).map(|user_id| Performance {
                inner_performance: p.inner_performance,
                user_id: user_id.to_string(),
                contest_id: contest_id.to_string(),
            })
        })
        .collect();
    Ok(performances)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_standings() {
        let contest_id = "soundhound2018-summer-qual";
        let standings = get_standings(contest_id).unwrap();
        assert_eq!(standings.len(), 2156);
        let top1 = standings.into_iter().find(|s| s.place == 1).unwrap();
        assert_eq!(top1.user_id.as_str(), "uwi");
    }

    #[test]
    fn test_get_contest_performances() {
        let contest_id = "soundhound2018-summer-qual";
        let performances = get_contest_performances(contest_id).unwrap();
        assert_eq!(performances.len(), 1852);
    }

    #[test]
    fn test_get_performances() {
        let contest_id = "soundhound2018-summer-qual";
        let performances = get_performances(contest_id).unwrap();
        assert_eq!(performances.len(), 1852);
    }
}
