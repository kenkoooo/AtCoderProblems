-- Shortest AC submission for each problem (minimum code length)
-- Only considers submissions after contest start time
-- If multiple submissions have the same length, picks the earliest submission ID

with valid_ac_submissions as (
    select
        s.submission_id,
        s.problem_id,
        s.contest_id,
        s.length
    from {{ ref('stg_submissions') }} s
    inner join {{ ref('stg_contests') }} c on s.contest_id = c.contest_id
    where s.is_accepted
      and s.epoch_second > c.start_epoch_second
),

min_length_per_problem as (
    select
        problem_id,
        min(length) as min_length
    from valid_ac_submissions
    group by problem_id
),

shortest_candidates as (
    select
        v.submission_id,
        v.problem_id,
        v.contest_id
    from valid_ac_submissions v
    inner join min_length_per_problem m
        on v.problem_id = m.problem_id
        and v.length = m.min_length
)

select distinct on (problem_id)
    contest_id,
    problem_id,
    submission_id
from shortest_candidates
order by problem_id, submission_id
