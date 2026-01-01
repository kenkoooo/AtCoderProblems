select
    id as contest_id,
    start_epoch_second,
    duration_second,
    title,
    rate_change,
    rate_change != '-' as is_rated
from {{ source('atcoder', 'contests') }}
