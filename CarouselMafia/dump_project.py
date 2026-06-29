"""
dump_project.py
────────────────
Собирает текстовые файлы проекта в один project_context.txt для передачи нейросети.

ВАЖНО (исправлено по сравнению со старой версией):
- Если когда-нибудь понадобится собрать несколько проектов в один дамп —
  это делается явно через аргументы командной строки, а не зашито в код.

Использование:
    python dump_project.py
        → сканирует только текущую папку (как и нужно в 99% случаев)

    python dump_project.py /path/to/other_project
        → сканирует текущую папку + явно указанные дополнительные пути

    python dump_project.py --only /path/to/project
        → сканирует ТОЛЬКО указанный путь, без текущей директории
"""

import argparse
import os
from pathlib import Path

# Папки, которые прячем от нейросети
IGNORE_DIRS = {
    'venv', '.venv', '__pycache__', '.git', '.vscode', '.idea',
    'node_modules', '.nuxt', '.output', 'dist', 'build', 'tests',
    '.pytest_cache', '.mypy_cache', 'logs', 'data',
}

# Конкретные файлы, которые прячем
IGNORE_FILES = {
    '.DS_Store', 'project_context.txt', 'dump_project.py',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.env',          # секреты / токены — никогда не должны попадать в дамп
    '.env.local',
    '.env.production',
}

# Разрешённые расширения
ALLOWED_EXTENSIONS = {
    '.py', '.txt', '.json', '.ini', '.cfg',
    '.md', '.js', '.ts', '.vue',
    '.env.example', '.env.sample',  # шаблоны без секретов — ок показать
}

# Если отдельный файл больше этого — скорее всего, это не код, а случайно
# попавший лог/бинарник/дамп. Пропускаем с предупреждением, чтобы не раздувать
# контекст и не тратить токены модели на мусор.
MAX_FILE_SIZE_BYTES = 300_000  # ~300 КБ


def iter_project_files(scan_root: Path):
    """Обходит scan_root и отдаёт пути файлов, прошедших фильтры, в стабильном порядке."""
    for root, dirs, files in os.walk(scan_root):
        dirs[:] = sorted(d for d in dirs if d not in IGNORE_DIRS and not d.startswith('.'))

        for file in sorted(files):
            if file in IGNORE_FILES:
                continue

            file_path = Path(root) / file

            # .env.example / .env.sample не имеют "обычного" suffix у Path,
            # поэтому проверяем полное имя отдельно от основного списка расширений
            if file_path.suffix not in ALLOWED_EXTENSIONS and file not in ALLOWED_EXTENSIONS:
                continue

            yield file_path


def aggregate_context(scan_dirs: list[Path], output_file: Path):
    print("[*] Сборка архитектуры запущена")
    print(f"[*] Будут просканированы директории:")
    for d in scan_dirs:
        print(f"    - {d}")

    count = 0
    skipped_large = []

    with open(output_file, "w", encoding="utf-8") as out:
        for scan_root in scan_dirs:
            if not scan_root.exists():
                print(f"[!] Директория не найдена, пропускаю: {scan_root}")
                continue

            print(f"\n[*] Сканируется: {scan_root}")

            for file_path in iter_project_files(scan_root):
                try:
                    size = file_path.stat().st_size
                    if size > MAX_FILE_SIZE_BYTES:
                        skipped_large.append((file_path, size))
                        print(f"[!] Пропущен (слишком большой, {size // 1024} КБ): {file_path}")
                        continue

                    rel_path = file_path.relative_to(scan_root)

                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()

                    if not content.strip():
                        content = "<ЭТОТ ФАЙЛ ПУСТОЙ>"

                    out.write(f"Источник: {scan_root}\n")
                    out.write(f"Путь к файлу: {rel_path}\n")
                    out.write(content)
                    out.write("\n\n" + "=" * 80 + "\n\n")

                    count += 1
                    print(f"[+] {rel_path}")

                except Exception as e:
                    print(f"[-] Ошибка чтения {file_path}: {e}")

    # Финальная сводка — чтобы сразу было видно, если что-то пошло не так
    total_lines = sum(1 for _ in open(output_file, encoding="utf-8", errors="ignore"))
    print(f"\n[✓] Успешно! {count} файлов упаковано в {output_file}")
    print(f"[i] Итоговый размер дампа: {total_lines} строк")

    if skipped_large:
        print(f"[!] Пропущено {len(skipped_large)} крупных файлов (>{MAX_FILE_SIZE_BYTES // 1000} КБ):")
        for fp, size in skipped_large:
            print(f"    - {fp} ({size // 1024} КБ)")

    if total_lines > 5000:
        print(
            "[!] ПРЕДУПРЕЖДЕНИЕ: дамп получился очень большим (>5000 строк).\n"
            "    Проверьте вывод выше — возможно, скрипт случайно подхватил\n"
            "    директорию другого проекта или папку с зависимостями."
        )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Собирает текстовые файлы проекта в project_context.txt"
    )
    parser.add_argument(
        "extra_dirs", nargs="*", type=Path,
        help="Дополнительные директории для сканирования (помимо текущей)"
    )
    parser.add_argument(
        "--only", type=Path, default=None,
        help="Сканировать ТОЛЬКО эту директорию, игнорируя текущую"
    )
    parser.add_argument(
        "-o", "--output", type=Path, default=None,
        help="Путь к выходному файлу (по умолчанию: ./project_context.txt)"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    root_dir = Path.cwd()

    if args.only:
        scan_dirs = [args.only.resolve()]
    else:
        scan_dirs = [root_dir] + [d.resolve() for d in args.extra_dirs]

    output_file = (args.output or (root_dir / "project_context.txt")).resolve()

    aggregate_context(scan_dirs, output_file)


if __name__ == "__main__":
    main()