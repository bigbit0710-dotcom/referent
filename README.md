# referent

Программа-референт с английского на базе ИИ

## Запуск

```powershell
pnpm install
pnpm dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

Если раньше ставили зависимости через npm:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
pnpm install
```

## Скрипты

- `pnpm dev` — режим разработки
- `pnpm build` — сборка для production
- `pnpm start` — запуск production-сервера
