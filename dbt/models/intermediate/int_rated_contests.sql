-- Rated contests for point calculation
-- Conditions:
--   - is_rated = true
--   - Started after first AGC (2016/7/16, epoch 1468670400)
--   - Has at least 2 problems
--   - Excludes heuristic contests (ahc*)

select c.contest_id, c.start_epoch_second
from {{ ref('stg_contests') }} c
inner join (
    select contest_id, count(*) as problem_count
    from {{ ref('stg_contest_problem') }}
    group by contest_id
) cp on c.contest_id = cp.contest_id
where c.start_epoch_second >= 1468670400
  and c.is_rated
  and cp.problem_count >= 2
  and c.contest_id not like 'ahc%'
