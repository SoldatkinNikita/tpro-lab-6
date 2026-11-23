# Isolated copy for reverse engineering. See roundtrip.diff.
from __future__ import annotations
from datetime import datetime
from uuid import UUID

class AudioAnalysisService:
    """Проектный класс для «Анализ аудиозаписи». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6."""
    _model_name: str
    _thresholds: dict[str, float]

    def start(self, audio_id: UUID) -> UUID:
        raise NotImplementedError

    def get_audio_file(self, audio_id: UUID) -> bytes:
        raise NotImplementedError

    def extract_features(self, audio: bytes) -> dict[str, float]:
        raise NotImplementedError

    def filter_scores(self, scores: dict[str, float]) -> dict[str, float]:
        raise NotImplementedError

class CatalogAnalysisService:
    """Проектный класс для «Повторный анализ каталога». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6."""
    _filters: dict[str, str]
    _scheduled_at: datetime | None

    def start_catalog(self, filters: dict[str, str], scheduled_at: datetime | None) -> list[UUID]:
        raise NotImplementedError

    def select_audio(self, filters: dict[str, str]) -> list[UUID]:
        raise NotImplementedError

class AudioSearchService:
    """Проектный класс для «Поиск аудиозаписи». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6."""
    _limit: int
    _description: str
    _filters: dict[str, str]

    def search(self, description: str, filters: dict[str, str], limit: int) -> list[UUID]:
        raise NotImplementedError

    def set_limit(self, limit: int) -> None:
        raise NotImplementedError

class AnalysisJobService:
    """Проектный класс для «Управление заданием анализа». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6."""
    _current_job_id: UUID | None

    def create(self, audio_id: UUID) -> UUID:
        raise NotImplementedError

    def save_result(self, job_id: UUID, scores: dict[str, float]) -> None:
        raise NotImplementedError

    def list_jobs(self) -> list[UUID]:
        raise NotImplementedError

    def cancel(self, job_id: UUID) -> bool:
        raise NotImplementedError

    def get_status(self, job_id: UUID) -> str:
        raise NotImplementedError

class AnalysisResultService:
    """Проектный класс для «Управление результатами анализа». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6."""
    _export_format: str

    def get_history(self) -> list[UUID]:
        raise NotImplementedError

    def get_result(self, job_id: UUID) -> dict[str, float]:
        raise NotImplementedError

    def delete_result(self, job_id: UUID) -> bool:
        raise NotImplementedError

    def export_history(self) -> bytes:
        raise NotImplementedError

class AnalysisSettingsService:
    """Проектный класс для «Настройка параметров анализа». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6."""
    _model_name: str
    _weights_path: str
    _thresholds: dict[str, float]

    def select_model(self, name: str) -> None:
        raise NotImplementedError

    def import_model(self, file: str, name: str) -> None:
        raise NotImplementedError

    def set_thresholds(self, thresholds: dict[str, float]) -> None:
        raise NotImplementedError

class AuthServiceAdapter:
    """Проектный класс для «Вход в систему». Python 3. Каркас методов; реализация алгоритмов не входит в ЛР №6."""
    _principal_id: UUID | None

    def login(self, login: str, password: str) -> UUID:
        raise NotImplementedError

    def get_permissions(self) -> list[str]:
        raise NotImplementedError

    def check_permission(self, action: str) -> bool:
        raise NotImplementedError
