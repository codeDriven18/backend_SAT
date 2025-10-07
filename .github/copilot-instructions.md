# Copilot instructions for backend_SAT

Short goal
- Help contributors implement, test, and debug features for the Django-based EduPlatform backend and the two frontends (student, teacher).

What this repo contains (big picture)
- backend/: Django project split into two project folders historically (`eduplatform/` and `sat_platform/`) but the active API uses `eduplatform` (see `manage.py`).
- apps/: core Django apps: `tests` (student/teacher APIs), `users`, `analytics`, `notifications`.
- student-frontend/ and teacher-frontend/: separate React + Vite frontends running on ports 3000 and 3001 respectively.

Quick start / developer workflows
- Run backend locally (powershell):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r backend/requirements.txt; cd backend; python manage.py migrate; python manage.py runserver
```

- Frontends (two terminals):

```powershell
# student
cd student-frontend; npm install; npm run dev
# teacher
cd teacher-frontend; npm install; npm run dev
```

Key conventions and patterns
- Single JWT auth flow: backend uses `rest_framework_simplejwt`. Endpoints under `api/auth/` (see `apps/users/urls.py`). Use `Authorization: Bearer <token>` for API requests.
- API routing: `eduplatform/urls.py` exposes separated namespaces:
  - `api/student/` -> `apps.tests.student_urls`
  - `api/teacher/` -> `apps.tests.teacher_urls`
  - `api/auth/` -> `apps.users.urls`
- View patterns:
  - `apps/tests/teacher_views.py` and `student_views.py` use DRF ViewSets and APIViews. Examples:
    - `TeacherTestViewSet` in `teacher_views.py` (uses `TestGroup*` serializers; create uses `TestGroupCreateSerializer`).
    - `TestLibraryViewSet.preview` shows how to return nested section summaries.
- Database: Postgres configured via `dj_database_url` in production; local defaults in `eduplatform/settings.py` use a Postgres instance (credentials present in file). `sat_platform/settings.py` is a legacy/project variant — primary settings used by `manage.py` is `eduplatform.settings`.
- Static/media: `MEDIA_ROOT` and `STATIC_ROOT` configured in `eduplatform/settings.py`; media served only when `DEBUG` is True by `eduplatform/urls.py`.

Testing and linting
- Backend: tests in `apps/*/tests.py`. Run with:

```powershell
cd backend; .\.venv\Scripts\Activate.ps1; python manage.py test
```

- Frontend: `npm run lint` available in each frontend; unit tests not present by default.

Performance and query patterns to follow
- Use `select_related` and `prefetch_related` on queryset-heavy endpoints (see `TestLibraryViewSet.get_queryset`). Follow existing patterns to avoid N+1 queries.
- Use `page_size` default (20) from DRF settings for list endpoints.

Files to check first when changing behavior
- `apps/tests/models.py` and `apps/tests/serializers.py` — core domain models and serialization rules.
- `apps/users/models.py` and `apps/users/serializers.py` — custom `User` model and auth behavior.
- `eduplatform/settings.py` — environment-specific settings (DB, CORS, JWT lifetimes).
- `eduplatform/urls.py` and `apps/tests/teacher_urls.py`/`student_urls.py` — routing and endpoint organization.

Common code patterns and gotchas
- Role checks: many APIViews check `request.user.user_type == 'teacher'` to enforce role-based access; preserve this logic when adding endpoints.
- Serializers: create and list serializers are different (e.g., `TestGroupCreateSerializer` vs `TestGroupSerializer`) — use `get_serializer_class` when needed.
- Schema/Docs: drf-spectacular is used; keep `extend_schema` annotations in new endpoints where example responses are helpful.
- Two settings modules exist; `manage.py` points to `eduplatform.settings`. If you ever need to run `sat_platform` use its own settings explicitly.

Integration points / external dependencies
- PostgreSQL (psycopg2-binary)
- Render deployment detection via `RENDER` env var in `eduplatform/settings.py`.
- Frontends call backend APIs on ports 3000/3001 during development; origin is configured in `CORS_ALLOWED_ORIGINS`.

How to make safe edits
- Run migrations after model changes: `python manage.py makemigrations` then `migrate`.
- Add `extend_schema` for public endpoints to keep docs consistent.
- Add tests in the corresponding app `tests.py` for regressions.

If something is missing
- Ask for which environment to target (local sqlite vs Postgres). The project uses Postgres by default; local quickstart may require installing Postgres or updating `DATABASES` to sqlite for quick PRs.

Examples (copyable)
- Get teacher's tests (requires Authorization header):
  GET /api/teacher/tests/

- Assign a test to a group (teacher only):
  POST /api/teacher/assign-test/  { "test_id": 5, "group_id": 2 }

---

If any section above is unclear or you'd like more details (CI, secrets, deployment), tell me which area to expand and I'll iterate.
