select
    s.id as submission_id,
    s.epoch_second,
    s.problem_id,
    s.contest_id,
    s.user_id,
    s.language,
    s.point,
    s.length,
    s.result,
    s.execution_time,
    s.result = 'AC' as is_accepted
from {{ source('atcoder', 'submissions') }} s
left join {{ ref('excluded_users') }} e on s.user_id = e.user_id
where e.user_id is null
