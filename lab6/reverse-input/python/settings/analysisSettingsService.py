#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class AnalysisSettingsService:
    """Класс AnalysisSettingsService подсистемы Модели и параметры."""
    def __init__(self):
        self.model_name = None
        self.weights_path = None
        self.thresholds = None

    def select_model(self, name):
        pass

    def import_model(self, file, name):
        pass

    def set_thresholds(self, thresholds):
        pass
