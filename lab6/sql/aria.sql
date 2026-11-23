-- Generated from native StarUML ERDColumn objects by scripts/lab6-finish.cjs.
-- PostgreSQL. Supplemental CHECK / UNIQUE / deferred constraints are explicit.
BEGIN;
CREATE SCHEMA aria;
SET search_path TO aria, public;

CREATE TABLE principal (
    id UUID NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE audio_recording (
    id UUID NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    tempo NUMERIC(7,3) CHECK (tempo > 0),
    tonic SMALLINT CHECK (tonic BETWEEN 0 AND 11),
    mode VARCHAR(16) CHECK (mode IN ('major','minor')),
    detune NUMERIC(8,3),
    PRIMARY KEY (id)
);

CREATE TABLE audio_file (
    id UUID NOT NULL,
    audio_id UUID NOT NULL UNIQUE REFERENCES audio_recording(id) ON DELETE CASCADE,
    location TEXT NOT NULL UNIQUE,
    duration NUMERIC(12,3) NOT NULL CHECK (duration > 0),
    format VARCHAR(16) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE tag (
    id UUID NOT NULL,
    name TEXT NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE emotion_label (
    id UUID NOT NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE analysis_model (
    id UUID NOT NULL,
    name TEXT NOT NULL UNIQUE,
    quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id)
);

CREATE TABLE weight_profile (
    id UUID NOT NULL,
    model_id UUID NOT NULL UNIQUE REFERENCES analysis_model(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE confidence_threshold (
    id UUID NOT NULL,
    model_id UUID NOT NULL REFERENCES analysis_model(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value NUMERIC(6,5) NOT NULL CHECK (value BETWEEN 0 AND 1),
    PRIMARY KEY (id),
    UNIQUE (model_id, name)
);

CREATE TABLE analysis_job (
    id UUID NOT NULL,
    audio_id UUID NOT NULL REFERENCES audio_recording(id) ON DELETE RESTRICT,
    model_id UUID NOT NULL REFERENCES analysis_model(id) ON DELETE RESTRICT,
    principal_id UUID REFERENCES principal(id) ON DELETE RESTRICT,
    status VARCHAR(16) NOT NULL CHECK (status IN ('queued','running','completed','cancelled','failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    progress NUMERIC(6,5) NOT NULL CHECK (progress BETWEEN 0 AND 1),
    error TEXT,
    request_source TEXT NOT NULL,
    thresholds_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (id),
    CHECK ((status IN ('completed','cancelled','failed')) = (finished_at IS NOT NULL)),
    CHECK (started_at IS NULL OR started_at >= created_at),
    CHECK (finished_at IS NULL OR finished_at >= COALESCE(started_at, created_at))
);

CREATE TABLE confidence_score (
    id UUID NOT NULL,
    job_id UUID NOT NULL REFERENCES analysis_job(id) ON DELETE CASCADE,
    characteristic TEXT NOT NULL,
    value TEXT NOT NULL,
    confidence NUMERIC(6,5) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    accepted BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (job_id, characteristic, value)
);

CREATE TABLE audio_recording_tag (
    audio_id UUID NOT NULL REFERENCES audio_recording(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (audio_id, tag_id)
);

CREATE TABLE audio_recording_emotion (
    audio_id UUID NOT NULL REFERENCES audio_recording(id) ON DELETE CASCADE,
    emotion_id UUID NOT NULL REFERENCES emotion_label(id) ON DELETE CASCADE,
    PRIMARY KEY (audio_id, emotion_id)
);

-- Mandatory 1:1 audio/file and model/weights are checked at transaction end.
ALTER TABLE audio_recording ADD CONSTRAINT audio_requires_file
    FOREIGN KEY (id) REFERENCES audio_file(audio_id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE analysis_model ADD CONSTRAINT model_requires_weights
    FOREIGN KEY (id) REFERENCES weight_profile(model_id) DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX analysis_job_audio_idx ON analysis_job(audio_id);
CREATE INDEX analysis_job_model_idx ON analysis_job(model_id);
CREATE INDEX analysis_job_principal_idx ON analysis_job(principal_id);
CREATE INDEX audio_tag_tag_idx ON audio_recording_tag(tag_id);
CREATE INDEX audio_emotion_label_idx ON audio_recording_emotion(emotion_id);
COMMIT;
