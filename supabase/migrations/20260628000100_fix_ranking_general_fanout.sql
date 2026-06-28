create or replace view public.ranking_general
with (security_invoker = true)
as
with point_totals as (
  select
    user_id,
    coalesce(sum(points), 0) as points
  from public.point_events
  group by user_id
),
progress_totals as (
  select
    user_id,
    count(challenge_id) as completed_challenges
  from public.user_challenge_progress
  group by user_id
)
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  coalesce(pt.points, 0) as points,
  coalesce(pr.completed_challenges, 0) as completed_challenges
from public.profiles p
left join point_totals pt on pt.user_id = p.id
left join progress_totals pr on pr.user_id = p.id
order by points desc, completed_challenges desc, p.created_at asc;
