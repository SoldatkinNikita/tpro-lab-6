"""Add PostgreSQL constraints to the DDL emitted by StarUML's DDL extension."""
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LAB=ROOT/'lab6'
data=json.loads((LAB/'ARIA-Lab6.mdj').read_text(encoding='utf-8'))


def walk(x):
    if isinstance(x,dict):
        if x.get('_type')=='ERDEntity':yield x
        for v in x.values():yield from walk(v)
    elif isinstance(x,list):
        for v in x:yield from walk(v)


tables={t['name']:t for t in walk(data)}
text=(LAB/'sql/native.sql').read_text(encoding='utf-8')
assert text.count('CREATE TABLE')==12
for name,t in tables.items():
    unique=[c['name'] for c in t['columns'] if c.get('unique')]
    if len(unique)>1:
        pattern=r'(CREATE TABLE '+re.escape(name)+r'\s*\([\s\S]*?)(UNIQUE\s*\([^)]*\))'
        text,n=re.subn(pattern,lambda m:m[1]+',\n    '.join('UNIQUE ('+c+')' for c in unique),text,count=1)
        assert n==1
text='-- StarUML Tools > DDL > Generate DDL; PostgreSQL constraints added below.\nBEGIN;\nCREATE SCHEMA aria;\nSET search_path TO aria, public;\n\n'+text+'\n'
cascade={'audio_file','weight_profile','confidence_threshold','confidence_score','audio_recording_tag','audio_recording_emotion'}
text=re.sub(r'(ALTER TABLE\s+(\w+)\s+ADD FOREIGN KEY[\s\S]*?)(;)',lambda m:m[1]+' ON DELETE '+('CASCADE' if m[2] in cascade else 'RESTRICT')+';',text,flags=re.I)
for name,t in tables.items():
    for col in t['columns']:
        description=col.get('documentation','')
        default=re.search(r'DEFAULT ([^;]+)',description)
        check=re.search(r'CHECK ([^;]+)',description)
        if default:text+=f"ALTER TABLE {name} ALTER COLUMN {col['name']} SET DEFAULT {default[1]};\n"
        if check:text+=f"ALTER TABLE {name} ADD CHECK ({check[1]});\n"
text+='''
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
'''
(LAB/'sql/aria.sql').write_text(text,encoding='utf-8')
print('Native DDL completed with PostgreSQL constraints.')
