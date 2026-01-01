select
    contest_id,
    problem_id,
    problem_index
from {{ source('atcoder', 'contest_problem') }}
