-- Run only in the disposable cluster created by scripts/check_database.py.
\set ON_ERROR_STOP on
BEGIN;
SET search_path TO aria, public;
CREATE FUNCTION pg_temp.expect_error(command TEXT, expected TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE actual TEXT;
BEGIN
    BEGIN
        EXECUTE command;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS actual = RETURNED_SQLSTATE;
        IF actual = expected THEN
            RAISE NOTICE 'PASS expected SQLSTATE %', expected;
            RETURN;
        END IF;
        RAISE EXCEPTION 'Expected %, received %: %', expected, actual, SQLERRM;
    END;
    RAISE EXCEPTION 'Statement unexpectedly succeeded: %', command;
END $$;

INSERT INTO principal VALUES ('00000000-0000-0000-0000-000000000011','Administrator');
INSERT INTO audio_recording(id,title,author,tempo,tonic,mode,detune)
VALUES ('00000000-0000-0000-0000-000000000001','Audio example','Author',120,0,'minor',0);
INSERT INTO audio_file VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','s3://audio/example.wav',120,'wav');
INSERT INTO tag VALUES ('00000000-0000-0000-0000-000000000003','instrumental');
INSERT INTO emotion_label VALUES ('00000000-0000-0000-0000-000000000004','calm','Calm audio');
INSERT INTO analysis_model(id,name) VALUES ('00000000-0000-0000-0000-000000000005','model-v1');
INSERT INTO weight_profile VALUES ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000005','s3://models/v1.bin');
INSERT INTO confidence_threshold VALUES ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000005','tempo',0.8);
INSERT INTO analysis_job(id,audio_id,model_id,principal_id,status,progress,request_source)
VALUES ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000011','queued',0,'test');
INSERT INTO confidence_score VALUES ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000008','tempo','120',0.9,TRUE);
INSERT INTO audio_recording_tag VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003');
INSERT INTO audio_recording_emotion VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004');
SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

SELECT pg_temp.expect_error($q$INSERT INTO tag VALUES ('00000000-0000-0000-0000-000000000099','instrumental')$q$,'23505');
SELECT pg_temp.expect_error($q$INSERT INTO audio_recording_tag SELECT * FROM audio_recording_tag$q$,'23505');
SELECT pg_temp.expect_error($q$UPDATE confidence_score SET confidence = 1.1$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE confidence_threshold SET value = -0.01$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE audio_recording SET tempo = 0$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE audio_recording SET tonic = 12$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE audio_recording SET mode = 'invalid'$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE audio_file SET duration = 0$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE analysis_job SET progress = 2$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE analysis_job SET status = 'unknown'$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE analysis_job SET status = 'completed'$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE analysis_job SET started_at = created_at - INTERVAL '1 second'$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE analysis_job SET audio_id = '00000000-0000-0000-0000-000000000099'$q$,'23503');
SELECT pg_temp.expect_error($q$UPDATE audio_recording_tag SET tag_id = '00000000-0000-0000-0000-000000000099'$q$,'23503');
SELECT pg_temp.expect_error($q$DELETE FROM analysis_model$q$,'23001');
SELECT pg_temp.expect_error($q$INSERT INTO audio_file VALUES ('00000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000001','s3://audio/other.wav',10,'wav')$q$,'23505');
SELECT pg_temp.expect_error($q$INSERT INTO audio_recording(id,title,author) VALUES ('00000000-0000-0000-0000-000000000099','orphan','author'); SET CONSTRAINTS ALL IMMEDIATE$q$,'23503');
SELECT pg_temp.expect_error($q$INSERT INTO analysis_model(id,name) VALUES ('00000000-0000-0000-0000-000000000099','orphan'); SET CONSTRAINTS ALL IMMEDIATE$q$,'23503');

DO $$ BEGIN
    IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='aria') <> 12 THEN
        RAISE EXCEPTION 'Expected 12 tables';
    END IF;
    IF (SELECT count(*) FROM audio_recording a JOIN audio_file f ON f.audio_id=a.id
        JOIN audio_recording_tag atg ON atg.audio_id=a.id JOIN tag t ON t.id=atg.tag_id) <> 1 THEN
        RAISE EXCEPTION 'Audio-file-tag join failed';
    END IF;
END $$;
-- The valid terminal-state update also checks the status/timestamp invariant.
UPDATE analysis_job SET status='completed',progress=1,finished_at=CURRENT_TIMESTAMP;
DELETE FROM confidence_score;
DELETE FROM analysis_job;
DELETE FROM audio_recording;
DELETE FROM analysis_model;
SET CONSTRAINTS ALL IMMEDIATE;
DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM audio_file) OR EXISTS(SELECT 1 FROM audio_recording_tag)
       OR EXISTS(SELECT 1 FROM audio_recording_emotion) OR EXISTS(SELECT 1 FROM weight_profile)
       OR EXISTS(SELECT 1 FROM confidence_threshold) THEN
        RAISE EXCEPTION 'Cascading deletion failed';
    END IF;
END $$;
ROLLBACK;
SELECT 'PASS: 12 tables; valid inserts and joins; 18 expected failures; terminal status; cascades; deferred 1:1' AS result;
