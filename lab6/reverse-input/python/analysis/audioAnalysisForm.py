#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class AudioAnalysisForm:
    """Реализация граничного класса «Форма Анализ аудиозаписи»."""
    def __init__(self):
        self.service = None
        self.title = None
        self.author = None
        self.duration = None
        self.format = None
        self.last_analysis = None
        self.filters = None
        self.audio_ids = None

    def handle(self, payload):
        pass
