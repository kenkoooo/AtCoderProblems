-- Count of distinct problems accepted by each user
select
    user_id,
    count(distinct problem_id) as problem_count
from {{ ref('int_accepted_submissions') }}
group by user_id
