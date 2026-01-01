-- Sum of points earned by each user from rated contests
-- Only considers contests with at least 2 problems
-- First AGC epoch: 1468670400 (July 16, 2016)

with rated_contests as (
    -- Contests that are rated, started after first AGC, and have >= 2 problems
    select c.contest_id
    from {{ ref('stg_contests') }} c
    inner join (
        select contest_id, count(*) as problem_count
        from {{ ref('stg_contest_problem') }}
        group by contest_id
    ) cp on c.contest_id = cp.contest_id
    where c.start_epoch_second >= 1468670400
      and c.is_rated
      and cp.problem_count >= 2
),

user_problem_max_points as (
    -- Get max point per user per problem (only from rated contests)
    select
        s.user_id,
        s.problem_id,
        max(s.point) as max_point
    from {{ ref('stg_submissions') }} s
    inner join {{ ref('stg_contest_problem') }} cp on s.problem_id = cp.problem_id
    inner join rated_contests rc on cp.contest_id = rc.contest_id
    where s.point = floor(s.point)  -- Only integer points
    group by s.user_id, s.problem_id
)

select
    user_id,
    sum(max_point)::bigint as point_sum
from user_problem_max_points
group by user_id
