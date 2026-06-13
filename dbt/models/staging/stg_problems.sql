select
    id as problem_id,
    contest_id,
    problem_index,
    name,
    title
from {{ source('atcoder', 'problems') }}
