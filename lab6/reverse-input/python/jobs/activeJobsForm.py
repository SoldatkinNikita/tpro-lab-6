#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class ActiveJobsForm:
    """Реализация граничного класса «Форма Активные задания»."""
    def __init__(self):
        self.service = None
        self.job_ids = None
        self.selected_job_id = None
        self.status = None
        self.progress = None

    def handle(self, payload):
        pass
