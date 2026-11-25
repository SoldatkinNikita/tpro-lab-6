#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class AnalysisHistoryForm:
    """Реализация граничного класса «Форма История анализов»."""
    def __init__(self):
        self.service = None
        self.filters = None
        self.analysis_ids = None
        self.selected_analysis_id = None
        self.export_file = None

    def handle(self, payload):
        pass
