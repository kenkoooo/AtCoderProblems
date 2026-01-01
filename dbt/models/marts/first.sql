-- First AC submission for each problem (earliest submission ID)
-- Only considers submissions after contest start time

with valid_ac_submissions as (
    select
        s.submission_id,
        s.problem_id,
        s.contest_id
    from {{ ref('stg_submissions') }} s
    inner join {{ ref('stg_contests') }} c on s.contest_id = c.contest_id
    where s.is_accepted
      and s.epoch_second > c.start_epoch_second
)

select distinct on (problem_id)
    contest_id,
    problem_id,
    submission_id
from valid_ac_submissions
order by problem_id, submission_id
