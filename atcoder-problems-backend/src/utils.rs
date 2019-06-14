use crate::sql::models::{Contest, Performance};
use std::cmp;
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

pub trait SplitToSegments<T> {
    fn split_to_segments(&self, size: usize) -> Vec<&[T]>;
}

impl<T> SplitToSegments<T> for [T] {
    fn split_to_segments(&self, size: usize) -> Vec<&[T]> {
        let mut result = vec![];
        let mut cur = self;
        while !cur.is_empty() {
            let (left, right) = cur.split_at(cmp::min(size, cur.len()));
            result.push(left);
            cur = right;
        }
        result
    }
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

    #[test]
    fn test_split_to_segments() {
        let values = (0..25000usize).collect::<Vec<usize>>();
        let segments = values.split_to_segments(10000);
        assert_eq!(segments.len(), 3);
        assert_eq!(segments[0].len(), 10000);
        assert_eq!(segments[1].len(), 10000);
        assert_eq!(segments[2].len(), 5000);
    }
}
