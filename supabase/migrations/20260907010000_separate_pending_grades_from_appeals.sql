-- Provider failures are retryable grading jobs, not child score appeals.
-- Remove only the system-created pending appeals from the previous behaviour.
delete from public.score_appeals
where status = 'pending'
  and child_comment = 'Automated grading was unavailable.';
