#!/usr/bin/env python3
# -*- coding: utf-8 -*-

class AuthClient:
    """Реализация граничного класса «Интерфейс Auth Service». Передаёт проверку учётных данных внешнему Auth Service; пароль не сохраняется."""
    def __init__(self):
        self.service = None

    def handle(self, payload):
        pass
