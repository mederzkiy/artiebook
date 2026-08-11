# 🎨 Artiebook

**Превратите детские рисунки в вечную памятную книгу**

Artiebook — это веб-сервис, который принимает фотографии детских рисунков (кривые, с фоном, с тенями) и автоматически обрабатывает их с помощью ИИ: выравнивает перспективу, удаляет фон, улучшает цвета и собирает всё в красивый PDF-файл для печати или просмотра на экране.

---

## 🚀 Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# 1. Клонируйте или скачайте проект
git clone <repo-url> artiebook
cd artiebook

# 2. Соберите Docker-образ
docker build -t artiebook .

# 3. Запустите контейнер
docker run -p 8000:8000 artiebook
```

Откройте в браузере: **http://localhost:8000**

### Вариант 2: Python (без Docker)

```bash
# 1. Убедитесь, что установлен Python 3.11+
python --version

# 2. Установите зависимости
pip install -r requirements.txt

# 3. Запустите сервер
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Откройте в браузере: **http://localhost:8000**

---

## 📁 Структура проекта

```
artiebook/
├── backend/
│   ├── main.py                  # FastAPI — точка входа
│   ├── api/
│   │   ├── models.py            # Pydantic-модели
│   │   └── routes.py            # REST API эндпоинты
│   ├── processing/
│   │   ├── exif_fix.py          # Коррекция ориентации EXIF
│   │   ├── deskew.py            # Выравнивание перспективы (OpenCV)
│   │   ├── background.py        # Удаление фона (rembg/ИИ)
│   │   ├── enhance.py           # Автокроп, шарпнинг, денойзинг
│   │   ├── pipeline.py          # Оркестратор обработки
│   │   └── pdf_generator.py     # Генерация PDF (ReportLab)
│   ├── jobs/
│   │   └── manager.py           # Менеджер фоновых задач
│   └── templates/
│       └── layouts.py           # Шаблоны дизайна книги
├── frontend/
│   ├── index.html               # Главная страница
│   ├── css/styles.css           # Стили (Vanilla CSS)
│   └── js/app.js                # Логика интерфейса
├── requirements.txt             # Python-зависимости
├── Dockerfile                   # Docker-сборка
└── README.md                    # Этот файл
```

---

## 🔧 API

| Метод  | Путь                           | Описание                           |
|--------|--------------------------------|------------------------------------|
| POST   | `/api/upload`                  | Загрузка фото + метаданные         |
| GET    | `/api/books/{job_id}`          | Статус обработки                   |
| GET    | `/api/download/{job_id}/digital` | Скачать Digital PDF              |
| GET    | `/api/download/{job_id}/print` | Скачать Print PDF                  |
| POST   | `/api/contact`                 | Форма обратной связи               |

---

## 🎨 Шаблоны книги

| Шаблон    | Описание                                          |
|-----------|---------------------------------------------------|
| Classic   | Тёплые пастельные тона, элегантные рамки          |
| Gallery   | Минималистичный белый стиль                        |
| Polaroid  | Эффект фотокарточки с тенью                       |

---

## ⚙️ Технологии

- **Backend:** Python 3.12, FastAPI, Uvicorn
- **Обработка изображений:** Pillow, OpenCV, rembg (ИИ)
- **Генерация PDF:** ReportLab
- **Frontend:** HTML5, Vanilla CSS, JavaScript
- **Контейнеризация:** Docker

---

## 📝 Лицензия

MIT License © 2024-2026 Artiebook
