-- Materialized table of accepted (AC) submissions with excluded users filtered out
-- This intermediate model is used by multiple downstream models to avoid
-- repeated filtering on result='AC' and excluded_users join

{{ config(materialized='table') }}

select
    s.id as submission_id,
    s.epoch_second,
    s.problem_id,
    s.contest_id,
    s.user_id,
    s.language,
    s.point,
    s.length,
    s.execution_time
from {{ source('atcoder', 'submissions') }} s
left join {{ ref('excluded_users') }} e on s.user_id = e.user_id
where e.user_id is null
  and s.result = 'AC'
