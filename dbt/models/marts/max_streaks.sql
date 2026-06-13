-- Maximum streak of consecutive days with at least one AC submission per user
-- Uses JST timezone (UTC+9) for day boundaries

with first_ac_per_problem as (
    -- Get the first AC submission for each user-problem pair
    select
        user_id,
        problem_id,
        min(epoch_second) as first_ac_epoch
    from {{ ref('int_accepted_submissions') }}
    group by user_id, problem_id
),

daily_solves as (
    -- Convert to JST date (epoch + 9 hours, then truncate to day)
    select distinct
        user_id,
        (to_timestamp(first_ac_epoch) at time zone 'UTC' at time zone 'Asia/Tokyo')::date as solve_date
    from first_ac_per_problem
),

with_prev_date as (
    select
        user_id,
        solve_date,
        lag(solve_date) over (partition by user_id order by solve_date) as prev_date
    from daily_solves
),

streak_groups as (
    select
        user_id,
        solve_date,
        -- Start a new streak group when there's a gap
        sum(case when prev_date is null or solve_date - prev_date > 1 then 1 else 0 end)
            over (partition by user_id order by solve_date) as streak_group
    from with_prev_date
),

streak_lengths as (
    select
        user_id,
        streak_group,
        count(*) as streak_length
    from streak_groups
    group by user_id, streak_group
)

select
    user_id,
    max(streak_length) as streak
from streak_lengths
group by user_id
