#!/usr/bin/env python3
import os
import json
import re


def generate_recipes_json(base_directory='przepisy'):
    """
    Generuje plik recipes.json na podstawie plików markdown w folderze przepisów.

    Struktura katalogów:
    przepisy/
      obiadowe/
        zupa_pomidorowa.md
        kotlet_schabowy.md
      desery/
        szarlotka.md

    Wygeneruje:
    [
      {
        "category": "obiadowe",
        "recipes": [
          { "title": "Zupa pomidorowa", "path": "przepisy/obiadowe/zupa_pomidorowa.md" },
          { "title": "Kotlet schabowy", "path": "przepisy/obiadowe/kotlet_schabowy.md" }
        ]
      },
      {
        "category": "desery",
        "recipes": [
          { "title": "Szarlotka", "path": "przepisy/desery/szarlotka.md" }
        ]
      }
    ]
    """
    if not os.path.exists(base_directory):
        print(f"Folder '{base_directory}' nie istnieje!")
        return

    recipes_data = []

    # Przeglądaj wszystkie podkatalogi w folderze bazowym
    for category_dir in os.listdir(base_directory):
        category_path = os.path.join(base_directory, category_dir)

        # Sprawdź czy to jest katalog
        if os.path.isdir(category_path):
            category_data = {
                "category": format_category_name(category_dir),
                "recipes": []
            }

            # Przeglądaj wszystkie pliki .md w katalogu kategorii
            for md_file in os.listdir(category_path):
                if md_file.endswith('.md'):
                    file_path = os.path.join(category_path, md_file)
                    recipe_title = extract_title_from_md(file_path) or format_title_from_filename(md_file)

                    category_data["recipes"].append({
                        "title": recipe_title,
                        "path": file_path.replace('\\', '/')  # Ujednolicenie separatorów ścieżki dla web
                    })

            # Dodaj kategorię tylko jeśli zawiera przepisy
            if category_data["recipes"]:
                recipes_data.append(category_data)

    # Zapisz dane do pliku JSON
    with open('recipes.json', 'w', encoding='utf-8') as json_file:
        json.dump(recipes_data, json_file, ensure_ascii=False, indent=2)

    print(f"Plik recipes.json został wygenerowany z {len(recipes_data)} kategoriami.")
    return recipes_data


def extract_title_from_md(file_path):
    """Wyciąga tytuł z pierwszej linii pliku markdown (# Tytuł)"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            first_line = file.readline().strip()
            # Sprawdź czy pierwsza linia to nagłówek markdown
            if first_line.startswith('# '):
                return first_line[2:].strip()
    except Exception as e:
        print(f"Nie udało się odczytać tytułu z {file_path}: {e}")
    return None


def format_title_from_filename(filename):
    """Formatuje tytuł na podstawie nazwy pliku"""
    title = os.path.splitext(filename)[0]  # Usuń rozszerzenie
    # Zamień podkreślenia i myślniki na spacje
    title = title.replace('_', ' ').replace('-', ' ')
    # Zamień pierwszą literę każdego słowa na wielką
    return ' '.join(word.capitalize() for word in title.split())


def format_category_name(category_dir):
    """Formatuje nazwę kategorii na podstawie nazwy folderu"""
    # Zamień podkreślenia i myślniki na spacje
    category = category_dir.replace('_', ' ').replace('-', ' ')
    # Zamień pierwszą literę każdego słowa na wielką
    return ' '.join(word.capitalize() for word in category.split())


if __name__ == "__main__":
    import sys

    # Umożliwia podanie innej ścieżki bazowej jako argument
    base_dir = sys.argv[1] if len(sys.argv) > 1 else 'przepisy'

    print(f"Generowanie pliku recipes.json na podstawie folderu '{base_dir}'...")
    generate_recipes_json(base_dir)