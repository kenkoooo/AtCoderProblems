use crate::sql::models::{Contest, Performance};
use std::collections::BTreeSet;

pub fn extract_non_performance_contests<'a>(
    contests: &'a [Contest],
    performances: &'a [Performance],
) -> Vec<&'a Contest> {
    let set = performances
        .iter()
        .map(|p| p.contest_id.as_str())
        .collect::<BTreeSet<_>>();
    contests
        .iter()
        .filter(|c| !set.contains(c.id.as_str()))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_non_performance_contests() {
        let contests = vec![
            Contest {
                id: "contest1".to_string(),
                ..Default::default()
            },
            Contest {
                id: "contest2".to_string(),
                ..Default::default()
            },
        ];

        let performances = vec![Performance {
            contest_id: "contest1".to_string(),
            ..Default::default()
        }];

        let filtered = extract_non_performance_contests(&contests, &performances);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].id.as_str(), "contest2");
    }
}
