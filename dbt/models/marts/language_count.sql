-- Count of distinct problems accepted by each user per simplified language
-- Language names are simplified by removing version info

with simplified_submissions as (
    select
        user_id,
        problem_id,
        -- Simplify language names by removing version info like "(5.0)" or "(GNU 9.2.1)"
        trim(case
            when language like 'Perl6%' then 'Raku'
            else regexp_replace(language, '\d*\s*\(.*\)', '', 'g')
        end) as simplified_language
    from {{ ref('int_accepted_submissions') }}
)

select
    user_id,
    simplified_language,
    count(distinct problem_id)::int as problem_count
from simplified_submissions
group by user_id, simplified_language
