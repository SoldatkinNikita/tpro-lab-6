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
    UNIQUE (audio_id, location)
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

ALTER TABLE audio_file ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id);
ALTER TABLE weight_profile ADD FOREIGN KEY (model_id) REFERENCES analysis_model(id);
ALTER TABLE confidence_threshold ADD FOREIGN KEY (model_id) REFERENCES analysis_model(id);
ALTER TABLE analysis_job ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id);
ALTER TABLE analysis_job ADD FOREIGN KEY (model_id) REFERENCES analysis_model(id);
ALTER TABLE analysis_job ADD FOREIGN KEY (principal_id) REFERENCES principal(id);
ALTER TABLE confidence_score ADD FOREIGN KEY (job_id) REFERENCES analysis_job(id);
ALTER TABLE audio_recording_tag ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id);
ALTER TABLE audio_recording_tag ADD FOREIGN KEY (tag_id) REFERENCES tag(id);
ALTER TABLE audio_recording_emotion ADD FOREIGN KEY (audio_id) REFERENCES audio_recording(id);
ALTER TABLE audio_recording_emotion ADD FOREIGN KEY (emotion_id) REFERENCES emotion_label(id);