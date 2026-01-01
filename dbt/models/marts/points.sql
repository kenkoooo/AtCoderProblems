-- Max points for each problem from rated contest submissions
-- Only counts submissions after contest start (excludes writer's test submissions)
-- First AGC epoch: 1468670400 (July 16, 2016)

with rated_submissions as (
    select
        s.problem_id,
        s.point
    from {{ ref('stg_submissions') }} s
    inner join {{ ref('stg_contests') }} c on s.contest_id = c.contest_id
    where c.start_epoch_second >= 1468670400  -- First AGC
      and c.is_rated
      and s.epoch_second >= c.start_epoch_second  -- Exclude pre-contest submissions
)

select
    problem_id,
    max(point) as point,
    null::double precision as predict  -- Placeholder for difficulty prediction
from rated_submissions
group by problem_id
