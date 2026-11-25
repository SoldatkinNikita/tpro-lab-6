"""Retire the superseded workflow and write the concise deliverable index."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'build/revision-before-native/legacy'
legacy=['scripts/lab6-model.cjs','scripts/lab6-finish.cjs','scripts/polish-model.cjs',
        'scripts/lab6.ejs','scripts/finish.ejs','scripts/inspect.ejs','scripts/reverse_python.py','scripts/staruml.ps1',
        'lab6/generated/aria_design.py','lab6/reverse-input/aria_design.py',
        'lab6/reverse-contract.json','lab6/roundtrip.diff','lab6/validation/reverse-import.json',
        'lab6/design-contract.json','lab6/database-contract.json','lab6/trace-pages.json']
legacy += [str(p.relative_to(ROOT)) for p in (ROOT/'lab6/logs').glob('*') if not p.name.startswith('native-') or '-error.' in p.name]
for name in legacy:
    source=(ROOT/name).resolve()
    target=(ARCHIVE/name).resolve()
    assert source.is_relative_to(ROOT) and target.is_relative_to(ROOT)
    if source.is_file():
        target.parent.mkdir(parents=True,exist_ok=True)
        if target.exists():target=target.with_name(target.name+'.previous')
        source.replace(target)
(ROOT/'README.md').write_text('''# ТРПО, лабораторная работа №6

Прямое и обратное проектирование ARIA. Солдаткин Н.С., ИУ5-11М.

- [LaTeX-отчёт](main.tex), [текст](sections/06-design.tex), PDF в `dist/`.
- [Модель StarUML](lab6/ARIA-Lab6.mdj).
- [Материалы и команды воспроизведения](lab6/report.md).
- [DDL PostgreSQL](lab6/sql/aria.sql).

Сборка отчёта: `./scripts/build-report.ps1`.
Код и DDL получены стандартными расширениями Python и DDL StarUML.
''',encoding='utf-8')
(ROOT/'lab6/report.md').write_text('''# Лабораторная работа №6

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
.\\scripts\\run-native.ps1 -Phase prepare
python scripts/prepare_native_reverse.py
python scripts/complete_native_ddl.py
.\\scripts\\run-native.ps1 -Phase reverse
python scripts/write_short_report.py
python scripts/check_database.py
python scripts/capture_documentation.py
.\\scripts\\build-report.ps1
python scripts/audit_artifacts.py
python scripts/check_report.py
```

Исходная модель сохранена в `source/`; материалы заменённого варианта находятся
в служебном каталоге `../build/revision-before-native/`.
''',encoding='utf-8')
(ROOT/'sections/05-references.tex').write_text(r'''\section*{СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ}
\begin{enumerate}
\item Виноградова М.~В., Королев С.~В., Волков А.~С.
Методические указания к лабораторной работе №6
«Прямое и обратное проектирование». -- М.: МГТУ им. Н.~Э.~Баумана, 2022.
\item Исходная модель ARIA: \path{lab6/source/ARIA-StarUML2.mdj}.
\item Python Extension for StarUML. \url{https://github.com/niklauslee/staruml-python}.
\item DDL Extension for StarUML. \url{https://github.com/niklauslee/staruml-ddl}.
\end{enumerate}
''',encoding='utf-8')
print('Superseded workflow archived; deliverable index updated.')
