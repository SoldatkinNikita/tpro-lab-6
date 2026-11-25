# Лабораторная работа №6

Солдаткин Н.С., ИУ5-11М. Основной отчёт: `../main.tex`.

- `ARIA-Lab6.mdj` — модель с трассировками и раскрытыми атрибутами и операциями.
- `diagrams/` — экспорты диаграмм; `diagram-manifest.json` — перечень.
- `generated/python/` — исходный результат команды StarUML `Tools > Python > Generate Code`.
- `reverse-input/python/` — отдельная изменённая копия кода для `Tools > Python > Reverse Code`.
- `sql/native.sql` — результат `Tools > DDL > Generate DDL`.
- `sql/aria.sql` — DDL с дополнительными ограничениями PostgreSQL.
- `docs/html/index.html` — сгенерированная документация.
- `validation/` — проверки нативной генерации, обратного проектирования, модели и SQL.
- `statistics.json` — статистика модели.

В `AudioSearchService` добавлены атрибут `limit` и метод `set_limit`.
В `AudioAnalysisService` удалён атрибут `model_name`.
Изменения отражены результатом штатного обратного проектирования.

## Воспроизведение

В StarUML установлены стандартные расширения [Python](https://github.com/niklauslee/staruml-python)
и [DDL](https://github.com/niklauslee/staruml-ddl), версия 0.9.2.
Сценарий `native-workflow.cjs` управляет элементами модели и вызывает команды
этих расширений; собственных генераторов кода и собственного Python-импорта нет.

```powershell
.\scripts\run-native.ps1 -Phase prepare
python scripts/prepare_native_reverse.py
python scripts/complete_native_ddl.py
.\scripts\run-native.ps1 -Phase reverse
python scripts/write_short_report.py
python scripts/check_database.py
python scripts/capture_documentation.py
.\scripts\build-report.ps1
python scripts/audit_artifacts.py
python scripts/check_report.py
```

Исходная модель сохранена в `source/`; материалы заменённого варианта находятся
в служебном каталоге `../build/revision-before-native/`.
