-- Count of distinct users who solved each problem
select
    problem_id,
    count(distinct user_id)::int as user_count
from {{ ref('int_accepted_submissions') }}
group by problem_id
