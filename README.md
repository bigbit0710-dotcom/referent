# referent

Программа-референт с английского на базе ИИ
Project.md - описание проекта


## Запуск

```powershell
pnpm install
pnpm dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

### Ошибка «layout router to be mounted» или Internal Server Error

Обычно из‑за нескольких одновременно запущенных серверов. Перезапуск с очисткой:

```powershell
pnpm dev:restart
```

Или вручную:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm dev
```

Открывайте приложение в **Chrome или Edge**, не во встроенном браузере Cursor.

Если раньше ставили зависимости через npm:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
pnpm install
```

## Скрипты

- `pnpm dev` — режим разработки (Turbopack, порт 3000)
- `pnpm dev:restart` — остановить старые серверы, очистить `.next`, запустить dev
- `pnpm build` — сборка для production
- `pnpm start` — запуск production-сервера
