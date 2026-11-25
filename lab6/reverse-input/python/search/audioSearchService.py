class AudioSearchService:
    """Класс AudioSearchService подсистемы Поиск аудиозаписей."""

    def __init__(self):
        self.description = None
        self.filters = None
        self.limit: int = 20

    def search(self, description, filters):
        pass

    def build_conditions(self):
        pass

    def set_limit(self, limit: int):
        self.limit = limit
