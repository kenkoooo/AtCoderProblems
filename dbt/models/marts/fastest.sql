-- Fastest AC submission for each problem (minimum execution time)
-- Only considers submissions after contest start time
-- If multiple submissions have the same execution time, picks the earliest submission ID

with valid_ac_submissions as (
    select
        s.submission_id,
        s.problem_id,
        s.contest_id,
        s.execution_time
    from {{ ref('int_accepted_submissions') }} s
    inner join {{ ref('stg_contests') }} c on s.contest_id = c.contest_id
    where s.execution_time is not null
      and s.epoch_second > c.start_epoch_second
),

min_time_per_problem as (
    select
        problem_id,
        min(execution_time) as min_execution_time
    from valid_ac_submissions
    group by problem_id
),

fastest_candidates as (
    select
        v.submission_id,
        v.problem_id,
        v.contest_id
    from valid_ac_submissions v
    inner join min_time_per_problem m
        on v.problem_id = m.problem_id
        and v.execution_time = m.min_execution_time
)

select distinct on (problem_id)
    contest_id,
    problem_id,
    submission_id
from fastest_candidates
order by problem_id, submission_id
