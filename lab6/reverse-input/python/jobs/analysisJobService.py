#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class AnalysisJobService:
    """Класс AnalysisJobService подсистемы Задания и результаты."""
    def __init__(self):
        self.current_job_id = None

    def create(self, audio_id):
        pass

    def save_result(self, job_id, scores):
        pass

    def list_jobs(self, ):
        pass

    def cancel(self, job_id):
        pass

    def get_status(self, job_id):
        pass
