#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class CatalogAnalysisForm:
    """Реализация граничного класса «Форма Анализ каталога»."""
    def __init__(self):
        self.service = None
        self.filters = None
        self.model_name = None
        self.scheduled_at = None
        self.audio_count = None

    def handle(self, payload):
        pass
