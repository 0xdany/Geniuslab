-- Remove only demo data created by `npm run db:seed`.
-- This intentionally keeps real manually/API-created candidates and assessments.
--
-- Run with:
--   psql "$DATABASE_URL" -f sql/remove-demo-data.sql
--
-- Demo markers used:
--   candidates.external_id = demo-*
--   candidates.email = candidate*@example.com
--   candidates.name = Demo Candidate *
--   api_keys.name = Demo ATS
--   user.id = seed-admin
--   email_messages.to_email = failed@example.com AND subject = Demo failed email

begin;

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
),
demo_candidates as (
  select c.id
  from candidates c
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
),
demo_responses as (
  select qr.id
  from question_responses qr
  where qr.assessment_id in (select id from demo_assessments)
)
delete from response_reviews
where response_id in (select id from demo_responses);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from assessment_reviews
where assessment_id in (select id from demo_assessments);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from email_messages
where assessment_id in (select id from demo_assessments)
   or (to_email = 'failed@example.com' and subject = 'Demo failed email');

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from video_objects
where assessment_id in (select id from demo_assessments);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
),
demo_attempts as (
  select qa.id
  from question_attempts qa
  where qa.assessment_id in (select id from demo_assessments)
)
delete from upload_sessions
where attempt_id in (select id from demo_attempts);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from question_responses
where assessment_id in (select id from demo_assessments);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from question_attempts
where assessment_id in (select id from demo_assessments);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from assessment_questions
where assessment_id in (select id from demo_assessments);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from candidate_sessions
where assessment_id in (select id from demo_assessments);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from assessment_tokens
where assessment_id in (select id from demo_assessments);

with demo_assessments as (
  select a.id
  from assessments a
  join candidates c on c.id = a.candidate_id
  where c.external_id ~ '^demo-[0-9]+$'
    and c.email ~ '^candidate[0-9]+@example\.com$'
    and c.name like 'Demo Candidate %'
)
delete from assessments
where id in (select id from demo_assessments);

delete from candidates
where external_id ~ '^demo-[0-9]+$'
  and email ~ '^candidate[0-9]+@example\.com$'
  and name like 'Demo Candidate %';

delete from api_key_usage
where api_key_id in (select id from api_keys where name = 'Demo ATS');

delete from api_idempotency_keys
where api_key_id in (select id from api_keys where name = 'Demo ATS');

delete from api_request_logs
where api_key_id in (select id from api_keys where name = 'Demo ATS');

delete from api_keys
where name = 'Demo ATS';

delete from admin_audit_logs
where user_id = 'seed-admin';

delete from admin_profiles
where user_id = 'seed-admin';

delete from "user"
where id = 'seed-admin'
  and name = 'Demo Admin';

commit;
