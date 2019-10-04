use std::cmp;

pub trait SplitToSegments<T> {
    fn split_into_segments(&self, size: usize) -> Vec<&[T]>;
}

impl<T> SplitToSegments<T> for [T] {
    fn split_into_segments(&self, size: usize) -> Vec<&[T]> {
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
    fn test_split_to_segments() {
        let values = (0..25000usize).collect::<Vec<usize>>();
        let segments = values.split_into_segments(10000);
        assert_eq!(segments.len(), 3);
        assert_eq!(segments[0].len(), 10000);
        assert_eq!(segments[1].len(), 10000);
        assert_eq!(segments[2].len(), 5000);
    }
}
