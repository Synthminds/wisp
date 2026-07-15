-- verify-contract.sql — proves THE CONTRACT is enforced by the database itself,
-- not just by application code. Run against any migrated Wisp database (local
-- or Neon) AFTER `pnpm db:migrate`:
--
--   psql "$DATABASE_URL_OWNER" -v ON_ERROR_STOP=1 -f scripts/verify-contract.sql
--
-- Every assertion inserts a would-be violation and REQUIRES the database to
-- reject it. If any violation is accepted, the script aborts with a CONTRACT
-- VIOLATION error. All fixtures are rolled back — the script leaves no rows.
\set ON_ERROR_STOP on
BEGIN;

-- Valid fixtures the confirmation/plan assertions reference.
INSERT INTO responsibility
  (id, category, name,
   planning_description, planning_owner_legacy, planning_dod,
   monitoring_description, monitoring_owner_legacy, monitoring_dod,
   execution_description, execution_owner, execution_dod,
   frequency, monitoring_tier)
VALUES
  ('vc-resp', 'cat', 'fixture',
   'pd', 'wes', 'pdod', 'md', 'wes', 'mdod', 'ed', 'wes', 'edod',
   'Daily', 'T1_calendar');

INSERT INTO signal (id, responsibility_id, tier, kind)
VALUES ('00000000-0000-0000-0000-000000000001', 'vc-resp', 'T1_calendar', 'due');

INSERT INTO plan (id, week_of)
VALUES ('00000000-0000-0000-0000-0000000000a1', DATE '2026-07-06');

INSERT INTO plan_item (id, plan_id, responsibility_id, proposal)
VALUES ('00000000-0000-0000-0000-0000000000b1',
        '00000000-0000-0000-0000-0000000000a1', 'vc-resp', 'do it');

-- 1) execution.owner can NEVER be 'wisp' — the enum has no such value.
DO $$
BEGIN
  BEGIN
    INSERT INTO responsibility
      (id, category, name, planning_description, planning_owner_legacy, planning_dod,
       monitoring_description, monitoring_owner_legacy, monitoring_dod,
       execution_description, execution_owner, execution_dod, frequency, monitoring_tier)
    VALUES ('vc-bad-exec','c','n','pd','wes','pdod','md','wes','mdod','ed','wisp','edod','Daily','T1_calendar');
    RAISE EXCEPTION 'CONTRACT VIOLATION: execution_owner=wisp was accepted';
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE NOTICE 'PASS 1: execution_owner cannot be wisp (enum rejects it)';
  END;
END $$;

-- 2) planning/monitoring owner is pinned to 'wisp' by CHECK.
DO $$
BEGIN
  BEGIN
    INSERT INTO responsibility
      (id, category, name, planning_description, planning_owner, planning_owner_legacy, planning_dod,
       monitoring_description, monitoring_owner_legacy, monitoring_dod,
       execution_description, execution_owner, execution_dod, frequency, monitoring_tier)
    VALUES ('vc-bad-plan','c','n','pd','ria','wes','pdod','md','wes','mdod','ed','wes','edod','Daily','T1_calendar');
    RAISE EXCEPTION 'CONTRACT VIOLATION: planning_owner != wisp was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS 2: planning_owner is pinned to wisp by CHECK';
  END;
END $$;

-- 3) confirmation XOR — both ids set is rejected.
DO $$
BEGIN
  BEGIN
    INSERT INTO confirmation (signal_id, plan_item_id, confirmed_by)
    VALUES ('00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-0000000000b1', 'wes');
    RAISE EXCEPTION 'CONTRACT VIOLATION: confirmation with both ids was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS 3a: confirmation rejects both ids (XOR)';
  END;
  -- ... and neither id is also rejected.
  BEGIN
    INSERT INTO confirmation (signal_id, plan_item_id, confirmed_by)
    VALUES (NULL, NULL, 'wes');
    RAISE EXCEPTION 'CONTRACT VIOLATION: confirmation with neither id was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS 3b: confirmation rejects neither id (XOR)';
  END;
END $$;

-- 4) partial-unique idempotency — a second confirmation for the same signal
--    is a duplicate, not a new row (double-tap = same outcome).
DO $$
BEGIN
  INSERT INTO confirmation (signal_id, confirmed_by)
  VALUES ('00000000-0000-0000-0000-000000000001', 'wes');
  BEGIN
    INSERT INTO confirmation (signal_id, confirmed_by)
    VALUES ('00000000-0000-0000-0000-000000000001', 'ria');
    RAISE EXCEPTION 'CONTRACT VIOLATION: a second confirmation for the same signal was accepted';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS 4: double-confirm on one signal hits the partial-unique index';
  END;
END $$;

-- 5) a pact must name its owner.
DO $$
BEGIN
  BEGIN
    INSERT INTO plan_item (plan_id, responsibility_id, proposal, pact, pact_owner)
    VALUES ('00000000-0000-0000-0000-0000000000a1', 'vc-resp', 'p', true, NULL);
    RAISE EXCEPTION 'CONTRACT VIOLATION: pact=true with null pact_owner was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS 5: pact=true requires a pact_owner (CHECK)';
  END;
END $$;

-- 6) RLS is enabled on every table (default-deny backstop).
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace AND NOT relrowsecurity;
  IF n <> 0 THEN
    RAISE EXCEPTION 'CONTRACT VIOLATION: % table(s) have RLS disabled', n;
  END IF;
  RAISE NOTICE 'PASS 6: row-level security is enabled on all public tables';
END $$;

DO $$ BEGIN RAISE NOTICE 'ALL CONTRACT ASSERTIONS PASSED'; END $$;

ROLLBACK;
