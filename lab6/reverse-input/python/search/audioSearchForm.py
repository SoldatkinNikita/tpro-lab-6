#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class AudioSearchForm:
    """Реализация граничного класса «Форма Поиск аудиозаписи»."""
    def __init__(self):
        self.service = None
        self.description = None
        self.filters = None
        self.sort_order = None
        self.audio_ids = None

    def handle(self, payload):
        pass
