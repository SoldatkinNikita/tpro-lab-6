"""Write the concise laboratory report in the order of the assignment."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'lab6/diagram-manifest.json').read_text(encoding='utf-8'))
items={d['code']:d for d in manifest}
parts=[r'''\section{Ход выполнения работы}
\subsection{Язык программирования и классы проектирования}
Для проектирования выбран Python. У атрибутов и операций заданы
типы, видимость, параметры и возвращаемые значения.
Исходная модель ARIA дополнена моделью проектирования.

\subsection{Трассировка граничных классов}
Граничные классы сопоставлены формам и адаптерам.
В классах форм указаны поля экранов и операции обработки действий.
Связи соответствия обозначены стереотипом \texttt{trace}.
''']


def figure(code,caption=None):
    item=items[code]
    text=caption or item['name'].split(' ',1)[1]
    text=text.replace('—','--').replace('_',r'\_')
    parts.append(r'\reportDiagram{'+code+'}{'+text+'}{fig:lab-'+code.replace('.','-')+'}\n')


def group(prefix):
    for code in sorted([c for c in items if c==prefix or c.startswith(prefix+'.')],key=lambda c:tuple(map(int,c.split('.')))):
        figure(code)


group('22');group('23')
parts.append('Форма поиска дополнена отдельными классами поля описания, панели фильтров, таблицы результатов и кнопки поиска.\n')
figure('40')
parts.append(r'''\subsection{Трассировка управляющих классов}
Управляющие классы преобразованы в сервисные классы проектирования.
На диаграммах раскрыты их атрибуты, операции и параметры.
''')
group('24')
parts.append(r'''\subsection{Прямое и обратное проектирование}
Командой \texttt{Tools > Python > Generate Code} из пакетов
подсистем получены Python-файлы в \path{lab6/generated/python/}.
В копии кода класса \texttt{AudioSearchService} добавлены атрибут
\texttt{limit: int} и метод \texttt{set\_limit(limit: int)}.
У класса \texttt{AudioAnalysisService} удалён атрибут \texttt{model\_name}.
Командой \texttt{Tools > Python > Reverse Code} выполнено обратное
проектирование изменённого кода. Полученные изменения показаны на рисунках.
''')
figure('38');figure('41')
parts.append(r'''\subsection{Трассировка пакетов в подсистемы}
Для восьми пакетов анализа созданы подсистемы проектирования.
Классы распределены по их ответственности.
''')
figure('25')
parts.append(r'''\subsection{Инфологическая модель}
По классам-сущностям построена инфологическая модель:
указаны атрибуты, первичные ключи, связи и кратности.
Аудиозапись связана с файлом отношением 1:1, с тегами и
эмоциональными метками -- отношениями M:N.
''')
figure('28');figure('29');figure('39')
parts.append(r'''\subsection{Трассировка классов-сущностей}
Классы-сущности анализа сопоставлены сущностям инфологической модели.
На обеих сторонах трассировки показаны атрибуты.
''')
group('32')
parts.append(r'''\subsection{Даталогическая модель}
Построена модель PostgreSQL: для таблиц заданы столбцы,
типы данных, первичные и внешние ключи.
Связи M:N раскрыты двумя связующими таблицами.
''')
figure('30');figure('31');figure('37')
parts.append(r'''Сущности инфологической модели сопоставлены таблицам базы данных.
''')
group('33')
parts.append(r'''\subsection{DDL-сценарий}
Командой \texttt{Tools > DDL > Generate DDL} получен SQL-сценарий.
В него добавлены ограничения значений и отложенные внешние ключи
для обязательных связей 1:1. Полный сценарий: \path{lab6/sql/aria.sql}.
Сценарий выполнен в PostgreSQL; таблицы и ограничения проверены.
Ниже приведён фрагмент создания таблицы аудиозаписей.
\VerbatimInput[fontsize=\small,firstline=6,lastline=17,breaklines=true]{lab6/sql/aria.sql}

\subsection{Документация проекта}
Командой \texttt{Export to HTML} сформирована документация модели:
описания классов, атрибутов, операций и диаграмм.
\begin{figure}[H]\centering
\includegraphics[width=\textwidth]{lab6/docs/documentation-example.png}
\caption{Пример сгенерированной документации класса поиска}
\end{figure}

\subsection{Проверка модели}
Выполнена встроенная проверка модели. Ошибок не обнаружено.
Результат сохранён в \path{lab6/validation/staruml-validation.json}.
\begin{Verbatim}[fontsize=\small,frame=single]
StarUML 7.1.1
VALIDATION RESULTS: NO ERRORS
errors: []
\end{Verbatim}

\subsection{Статистика проекта}
Подсчитаны элементы сохранённой модели; повторные изображения
одного элемента на разных диаграммах отдельно не учитывались.
\input{lab6/statistics.tex}
\begin{table}[H]\centering
\caption{Статистика проекта}
\begin{tabularx}{\textwidth}{|X|r|r|}\hline
Элемент & Добавлено & Всего \\\hline
Пакеты & \statLabSixPackages & \statTotalPackages \\\hline
Подсистемы & \statLabSixSubsystems & \statTotalSubsystems \\\hline
Диаграммы & \statLabSixDiagrams & \statTotalDiagrams \\\hline
Классы & \statLabSixUmlClasses & \statTotalUmlClasses \\\hline
Связи & \statLabSixRelationships & \statTotalRelationships \\\hline
Таблицы & \statLabSixTables & \statTotalTables \\\hline
\end{tabularx}\end{table}

\subsection{Структура проекта базы данных}
Создана структура пакетов для инфологической, даталогической
и физической моделей. PostgreSQL хранит метаданные и результаты;
файлы аудиозаписей и весов размещаются в файловом хранилище.
''')
figure('35');figure('34')
(ROOT/'sections/06-design.tex').write_text('\n'.join(parts),encoding='utf-8')
(ROOT/'sections/01-goal.tex').write_text(r'''\section{Цель работы}
Освоить построение модели проектирования, прямое и обратное
проектирование кода, разработку моделей базы данных и генерацию DDL.

\section{Задание}
На основе модели ARIA выполнить трассировку классов и пакетов,
прямое и обратное проектирование, построить инфологическую
и даталогическую модели, получить DDL и документацию,
проверить модель и составить статистику проекта~[1].
''',encoding='utf-8')
(ROOT/'sections/04-conclusion.tex').write_text(r'''\section{Заключение}
Разработана модель проектирования ARIA. Построены трассировки классов
и пакетов, выполнены генерация Python-кода и обратное проектирование.
Получены модели базы данных, DDL, документация и статистика проекта.
''',encoding='utf-8')
print('Concise report written.')
