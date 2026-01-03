-- Sum of rated points earned by each user
-- Only counts submissions after contest start (excludes writer's test submissions)

with user_problem_max_points as (
    select
        s.user_id,
        s.problem_id,
        max(s.point) as max_point
    from {{ ref('int_rated_contests') }} rc
    inner join {{ ref('stg_contest_problem') }} cp on rc.contest_id = cp.contest_id
    inner join {{ ref('stg_submissions') }} s on cp.problem_id = s.problem_id
    where s.epoch_second >= rc.start_epoch_second  -- Exclude pre-contest submissions
      and s.point = floor(s.point)  -- Only integer points
    group by s.user_id, s.problem_id
)

select
    user_id,
    sum(max_point)::bigint as point_sum
from user_problem_max_points
group by user_id
