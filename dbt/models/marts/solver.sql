-- Count of distinct users who solved each problem
select
    problem_id,
    count(distinct user_id) as user_count
from {{ ref('stg_submissions') }}
where is_accepted
group by problem_id
