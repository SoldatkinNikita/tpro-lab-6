-- StarUML Tools > DDL > Generate DDL; PostgreSQL constraints added below.
BEGIN;
CREATE SCHEMA aria;
SET search_path TO aria, public;

CREATE TABLE audio_recording (
    id UUID NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    tempo NUMERIC(7,3),
    tonic SMALLINT,
    mode VARCHAR(16),
    detune NUMERIC(8,3),
    PRIMARY KEY (id)
);

CREATE TABLE audio_file (
    id UUID NOT NULL,
    audio_id UUID NOT NULL,
    location TEXT NOT NULL,
    duration NUMERIC(12,3) NOT NULL,
    format VARCHAR(16) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (audio_id),
    UNIQUE (location)
);

CREATE TABLE tag (
    id UUID NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE emotion_label (
    id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE principal (
    id UUID NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE analysis_model (
    id UUID NOT NULL,
    name TEXT NOT NULL,
    quality_metrics JSONB NOT NULL,
    active BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE weight_profile (
    id UUID NOT NULL,
    model_id UUID NOT NULL,
    location TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (model_id)
);

CREATE TABLE confidence_threshold (
    id UUID NOT NULL,
    model_id UUID NOT NULL,
    name TEXT NOT NULL,
    value NUMERIC(6,5) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE analysis_job (
    id UUID NOT NULL,
    audio_id UUID NOT NULL,
    model_id UUID NOT NULL,
    principal_id UUID,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    progress NUMERIC(6,5) NOT NULL,
    error TEXT,
    request_source TEXT NOT NULL,
    thresholds_snapshot JSONB NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE confidence_score (
    id UUID NOT NULL,
    job_id UUID NOT NULL,
    characteristic TEXT NOT NULL,
    value TEXT NOT NULL,
    confidence NUMERIC(6,5) NOT NULL,
    accepted BOOLEAN NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE audio_recording_tag (
    audio_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    PRIMARY KEY (audio_id, tag_id)
);

CREATE TABLE audio_recording_emotion (
    audio_id UUID NOT NULL,
    emotion_id UUID NOT NULL,
    PRIMARY KEY (audio_id, emotion_id)
);

ALTER TABLE audio_file ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id) ON DELETE CASCADE;
ALTER TABLE weight_profile ADD FOREIGN KEY (model_id) REFERENCES analysis_model(id) ON DELETE CASCADE;
ALTER TABLE confidence_threshold ADD FOREIGN KEY (model_id) REFERENCES analysis_model(id) ON DELETE CASCADE;
ALTER TABLE analysis_job ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id) ON DELETE RESTRICT;
ALTER TABLE analysis_job ADD FOREIGN KEY (model_id) REFERENCES analysis_model(id) ON DELETE RESTRICT;
ALTER TABLE analysis_job ADD FOREIGN KEY (principal_id) REFERENCES principal(id) ON DELETE RESTRICT;
ALTER TABLE confidence_score ADD FOREIGN KEY (job_id) REFERENCES analysis_job(id) ON DELETE CASCADE;
ALTER TABLE audio_recording_tag ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id) ON DELETE CASCADE;
ALTER TABLE audio_recording_tag ADD FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE;
ALTER TABLE audio_recording_emotion ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id) ON DELETE CASCADE;
ALTER TABLE audio_recording_emotion ADD FOREIGN KEY (emotion_id) REFERENCES emotion_label(id) ON DELETE CASCADE;
ALTER TABLE audio_recording ADD CHECK (tempo > 0);
ALTER TABLE audio_recording ADD CHECK (tonic BETWEEN 0 AND 11);
ALTER TABLE audio_recording ADD CHECK (mode IN ('major','minor'));
ALTER TABLE audio_file ADD CHECK (duration > 0);
ALTER TABLE analysis_model ALTER COLUMN quality_metrics SET DEFAULT '{}'::jsonb;
ALTER TABLE analysis_model ALTER COLUMN active SET DEFAULT FALSE;
ALTER TABLE confidence_threshold ADD CHECK (value BETWEEN 0 AND 1);
ALTER TABLE analysis_job ADD CHECK (status IN ('queued','running','completed','cancelled','failed'));
ALTER TABLE analysis_job ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE analysis_job ADD CHECK (progress BETWEEN 0 AND 1);
ALTER TABLE analysis_job ALTER COLUMN thresholds_snapshot SET DEFAULT '{}'::jsonb;
ALTER TABLE confidence_score ADD CHECK (confidence BETWEEN 0 AND 1);

ALTER TABLE confidence_threshold ADD UNIQUE (model_id, name);
ALTER TABLE confidence_score ADD UNIQUE (job_id, characteristic, value);
ALTER TABLE analysis_job ADD CHECK ((status IN ('completed','cancelled','failed')) = (finished_at IS NOT NULL));
ALTER TABLE analysis_job ADD CHECK (started_at IS NULL OR started_at >= created_at);
ALTER TABLE analysis_job ADD CHECK (finished_at IS NULL OR finished_at >= COALESCE(started_at, created_at));
ALTER TABLE audio_recording ADD CONSTRAINT audio_requires_file FOREIGN KEY (id) REFERENCES audio_file(audio_id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE analysis_model ADD CONSTRAINT model_requires_weights FOREIGN KEY (id) REFERENCES weight_profile(model_id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX analysis_job_audio_idx ON analysis_job(audio_id);
CREATE INDEX analysis_job_model_idx ON analysis_job(model_id);
CREATE INDEX analysis_job_principal_idx ON analysis_job(principal_id);
CREATE INDEX audio_tag_tag_idx ON audio_recording_tag(tag_id);
CREATE INDEX audio_emotion_label_idx ON audio_recording_emotion(emotion_id);
COMMIT;
