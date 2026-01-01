-- Count of distinct problems accepted by each user
select
    user_id,
    count(distinct problem_id) as problem_count
from {{ ref('stg_submissions') }}
where is_accepted
group by user_id
