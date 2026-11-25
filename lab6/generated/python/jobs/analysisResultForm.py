#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class AnalysisResultForm:
    """Реализация граничного класса «Форма Результат анализа»."""
    def __init__(self):
        self.service = None
        self.audio_id = None
        self.job_id = None
        self.scores = None
        self.thresholds_snapshot = None

    def handle(self, payload):
        pass
