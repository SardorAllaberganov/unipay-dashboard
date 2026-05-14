# UNIPAY — Информационная архитектура

> Единая карта всех страниц, вкладок и locked-фич мерчант-панели + overlay видимости по ролям на каждый маршрут.
> Нарративы пользовательских сценариев по ролям — в [USER_FLOWS_BY_ROLE.md](./USER_FLOWS_BY_ROLE.md).

---

## 1. Обзор

UNIPAY — мерчант-панель для узбекских образовательных учреждений для управления оплатой обучения. **9 функциональных модулей** и модель прав на **4 роли**.

### 4 роли (из [src/types/domain.ts](../src/types/domain.ts) — `Role`)

| Роль *(в коде)* | Основная задача | Онбординг |
|---|---|---|
| **Владелец** *(`owner`)* | Контроль на уровне учреждения: настройка организации, управление сотрудниками, тариф, аудит | Проходит 5-шаговый мастер при первом входе (`onboardingComplete: false`) |
| **Финансовый менеджер** *(`finance_manager`)* | Ежедневные финансовые операции: платежи, возвраты, выплаты, отчёты | Пропускает онбординг |
| **Оператор** *(`operator`)* | Фронтлайн-работа: добавлять студентов, фиксировать платежи, гонять просрочки | Пропускает онбординг |
| **Наблюдатель** *(`viewer`)* | Только чтение: дашборды, отчёты, поиск | Пропускает онбординг |

### Источники истины

- **Маршруты** — [src/router.tsx](../src/router.tsx)
- **Группировка сайдбара + иконки** — [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)
- **Роли + матрица прав по ресурсам** — [src/types/domain.ts](../src/types/domain.ts) (`ROLE_PERMISSIONS`)
- **Лейблы вкладок** — компонент-уровневые файлы `*TabsNav.tsx`; i18n-ключи резолвятся через [src/lib/i18n/locales/ru.json](../src/lib/i18n/locales/ru.json) и [uz.json](../src/lib/i18n/locales/uz.json)
- **Статус модулей** — [docs/product_states.md](./product_states.md)

### Оговорка спека-vs-рантайм

Сегодня в [src/router.tsx](../src/router.tsx) **нет route-level `<RoleGuard>`**. Любой аутентифицированный пользователь может перейти на любой аутентифицированный маршрут по URL. Гейтинг прав закреплён **только внутри отдельных компонентов** (например, `StaffDetailPage` скрывает вкладку Сессии, пока зритель не Владелец и не сам сотрудник; `StudentDetailActionBar` скрывает Delete, пока `isOwner` не выполнено).

В матрице видимости ниже:
- ✓ — **по спеке видно** И компонент-уровневый гейтинг разрешает действие
- 🟡 — **сегодня видно в рантайме** по URL, но `ROLE_PERMISSIONS` говорит что не должно быть (будущий route-guard скроет)
- ✗ — **по спеке скрыто** И ни один компонент не рендерит действие

---

## 2. Навигация верхнего уровня (сайдбар)

В сайдбаре **6 секций**. Порядок, иконки и i18n-ключи определены в [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx). Во время онбординга все элементы tooltip-залочены (`onboarding.sidebarLockedTooltip`).

| Секция (i18n-ключ) | Лейбл (RU) | Элемент | Маршрут | Иконка | Статус |
|---|---|---|---|---|---|
| `nav.section.main` | Главное | Дашборд | `/` | `LayoutDashboard` | активен |
| `nav.section.organization` | Организация | Организация | `/organization` | `Building2` | активен |
| | | Сотрудники | `/staff` | `Users` | активен |
| `nav.section.students` | Студенты | Студенты | `/students` | `GraduationCap` | активен |
| | | Документы | `/locked/documents` | `FileText` | 🔒 скоро |
| `nav.section.payments` | Платежи | Транзакции | `/payments/transactions` | `ArrowLeftRight` | активен |
| | | Ожидающие | `/payments/pending` | `Clock` | активен |
| | | Возвраты | `/payments/refunds` | `Undo2` | активен |
| | | SMS-рассылки | `/locked/sms-campaigns` | `MessageSquare` | 🔒 скоро |
| `nav.section.finance` | Финансы | Отчёты | `/reports` | `FileBarChart` | активен |
| | | Выплаты | `/payouts` | `Banknote` | активен |
| | | AI-инсайты | `/locked/ai-insights` | `Bot` | 🔒 скоро |
| `nav.section.system` | Система | Настройки | `/settings` | `Settings` | активен |
| | | Мобильное приложение | `/locked/mobile-app` | `Smartphone` | 🔒 скоро |

---

## 3. Полное дерево маршрутов

```
/                                              Дашборд
│
├── /sign-in                                   Auth — вход
├── /forgot-password                           Auth — запрос сброса пароля
├── /reset-password                            Auth — установка нового пароля
│
├── /onboarding/:step                          5-шаговый мастер (последовательный guard)
│   ├── /onboarding/1                          Шаг 1 — информация об учреждении
│   ├── /onboarding/2                          Шаг 2 — контакты + брендинг
│   ├── /onboarding/3                          Шаг 3 — банковские счета
│   ├── /onboarding/4                          Шаг 4 — подразделения
│   └── /onboarding/5                          Шаг 5 — пригласить сотрудников
│
├── /organization                              OrganizationLayout (h1 + вкладки + outlet)
│   ├── /organization/profile                  Вкладка Профиль (по умолчанию)
│   ├── /organization/departments              Вкладка Подразделения
│   ├── /organization/bank-accounts            Вкладка Банковские счета
│   ├── /organization/branding                 Вкладка Брендинг
│   ├── /organization/bank-accounts/new        Добавить банковский счёт (sub-page)
│   └── /organization/departments/new          Добавить подразделение (sub-page)
│
├── /staff                                     Список сотрудников
│   └── /staff/:id                             Деталь сотрудника — 4 вкладки:
│                                                • Профиль
│                                                • Роль и права
│                                                • Журнал активности
│                                                • Сессии (только Владелец ИЛИ сам)
│
├── /students                                  Список студентов
│   ├── /students/new                          Добавить студента
│   ├── /students/import                       Мастер импорта (4 внутренних шага)
│   ├── /students/schedules                    Шаблоны расписаний
│   ├── /students/:id                          Профиль студента — 4 вкладки:
│   │                                            • Расписание
│   │                                            • Транзакции
│   │                                            • Заметки
│   │                                            • Журнал
│   └── /students/:id/edit                     Редактировать студента
│
├── /payments
│   ├── /payments/transactions                 Список транзакций
│   │   └── /payments/transactions/:id         Деталь транзакции
│   ├── /payments/pending                      Ожидающие + просроченные
│   └── /payments/refunds                      Очередь возвратов
│
├── /reports                                   ReportsLayout (h1 + вкладки + outlet)
│   ├── /reports/summary                       Вкладка Сводка (по умолчанию)
│   └── /reports/export                        Вкладка Экспорт
│
├── /payouts                                   История выплат
│   ├── /payouts/request                       Запросить выплату (или auto-info при `plan === 'auto'`)
│   └── /payouts/:id                           Деталь выплаты — таймлайн + breakdown
│
├── /settings                                  SettingsLayout (h1 + боковые вкладки + outlet)
│   ├── /settings/general                      Вкладка Общие (по умолчанию)
│   ├── /settings/security                     Вкладка Безопасность
│   ├── /settings/api                          Вкладка API и Webhooks
│   ├── /settings/integrations                 Вкладка Интеграции
│   ├── /settings/notifications                Вкладка Уведомления
│   ├── /settings/billing                      Вкладка Тариф
│   ├── /settings/audit                        Вкладка Журнал аудита
│   └── /settings/preferences                  Вкладка Предпочтения
│
├── /locked/:feature                           Coming-soon лендинг (см. §6)
│
└── /system/preview/*                          QA-only превью состояний ошибок
    ├── /system/preview/404
    ├── /system/preview/500
    ├── /system/preview/403
    ├── /system/preview/offline
    ├── /system/preview/maintenance
    └── /system/preview/error-boundary
```

### Сводка вкладок

| Модуль | Кол-во | Вкладки |
|---|:-:|---|
| Организация | 4 | Профиль · Подразделения · Банковские счета · Брендинг |
| Деталь сотрудника | 3–4 | Профиль · Роль и права · Журнал · Сессии* |
| Профиль студента | 4 | Расписание · Транзакции · Заметки · Журнал |
| Отчёты | 2 | Сводка · Экспорт |
| Настройки | 8 | Общие · Безопасность · API · Интеграции · Уведомления · Тариф · Аудит · Предпочтения |

*Вкладка Сессии в деталях сотрудника условна: видна только когда текущий пользователь — Владелец или открывает свой собственный профиль ([src/features/staff/pages/StaffDetailPage.tsx:97-99](../src/features/staff/pages/StaffDetailPage.tsx)).

---

## 4. Матрица видимости по ролям

Эта таблица сопоставляет каждый аутентифицированный маршрут с тем, что каждая роль *должна* видеть (по `ROLE_PERMISSIONS`) и что *реально* видит сегодня (только компонент-уровневый гейтинг). См. **оговорку спека-vs-рантайм** в §1.

Легенда: ✓ видно · ✓ʳ только чтение · 🟡 видно в рантайме, но по спеке нет · ✗ скрыто

| Группа маршрутов | Владелец | Финансовый менеджер | Оператор | Наблюдатель | Заметки |
|---|:-:|:-:|:-:|:-:|---|
| `/sign-in`, `/forgot-password`, `/reset-password` | ✓ | ✓ | ✓ | ✓ | Публично |
| `/onboarding/1…5` | ✓ | 🟡 | 🟡 | 🟡 | DEV-фикстуры: только у Владельца `onboardingComplete: false`. На практике только Владелец. |
| `/` (Дашборд) | ✓ | ✓ | ✓ | ✓ʳ | Приветствие + KPI — только чтение у Наблюдателя (нет действий) |
| `/organization/profile` | ✓ | ✓ʳ | 🟡 | 🟡 | `settings.read=false` для Оператора/Наблюдателя по спеке; рантайм пускает |
| `/organization/departments` | ✓ | ✓ʳ | 🟡 | 🟡 | Аналогично |
| `/organization/bank-accounts` (+ `/new`) | ✓ | ✓ʳ | 🟡 | 🟡 | Аналогично |
| `/organization/branding` | ✓ | ✓ʳ | 🟡 | 🟡 | Аналогично |
| `/staff` (список) | ✓ | ✓ʳ¹ | ✓ʳ | ✓ʳ | У всех ролей `staff.read=true`. Владелец + Финансовый менеджер видят kebab-действия. |
| `/staff/:id` | ✓ | ✓ʳ¹ | ✓ʳ | ✓ʳ | Вкладка Сессии только Владелец или сам |
| `/students` (список) | ✓ | ✓ | ✓ | ✓ʳ | Bulk-действия скрыты у Наблюдателя |
| `/students/new` | ✓ | ✓ | ✓ | 🟡 | `students.write=false` у Наблюдателя; рантайм пускает |
| `/students/import` | ✓ | ✓ | ✓ | 🟡 | Аналогично |
| `/students/schedules` | ✓ | ✓ | ✓ | 🟡 | Аналогично |
| `/students/:id` | ✓ | ✓ | ✓ | ✓ʳ | Деталь; action bar скрывает Edit/SMS/Deactivate у Наблюдателя (пока не закреплено) |
| `/students/:id` — кнопка Delete | ✓ | ✗ | ✗ | ✗ | Только Владелец ([StudentDetailActionBar.tsx:25](../src/features/students/components/profile/StudentDetailActionBar.tsx)) |
| `/students/:id/edit` | ✓ | ✓ | ✓ | 🟡 | `students.write=false` у Наблюдателя |
| `/payments/transactions` (+ `:id`) | ✓ | ✓ | ✓ | ✓ʳ | Все читают; Наблюдатель без write |
| `/payments/pending` | ✓ | ✓ | ✓ | ✓ʳ | Аналогично |
| `/payments/refunds` | ✓ | ✓² | ✓ʳ | ✓ʳ | `payments.destructive=true` только у Владельца + Финансового менеджера |
| `/reports/summary` | ✓ | ✓ | ✓ʳ | ✓ʳ | Все читают; настраивать могут только Владелец + Финансовый менеджер |
| `/reports/export` | ✓ | ✓ | ✓ʳ | ✓ʳ | Аналогично |
| `/payouts` (история) | ✓ | ✓ | ✓ʳ | ✓ʳ | Все читают; флоу запроса гейтится ниже |
| `/payouts/request` | ✓ | ✓ | 🟡 | 🟡 | `reports.write=false` для Оператора/Наблюдателя (выплаты наследуют); рантайм пускает |
| `/payouts/:id` | ✓ | ✓ | ✓ʳ | ✓ʳ | Кнопки Подтвердить/Отменить гейтятся статусом, а не ролью |
| `/settings/*` (все 8 вкладок) | ✓ | ✓ʳ | ✗ | ✗ | `settings.read=false` для Оператора + Наблюдателя по спеке |
| `/settings/audit` | ✓ | ✓ʳ | ✗ | ✗ | `audit.read=false` для Оператора + Наблюдателя по спеке |
| `/locked/:feature` | ✓ | ✓ | ✓ | ✓ | Coming-soon лендинги доступны всем |

**Сноски**

¹ **Действия управления сотрудниками для Финансового менеджера** — `ROLE_PERMISSIONS.finance_manager.staff.write = false`, но `PERMISSIONED_ROLES = ['owner', 'finance_manager']` и в [StaffRowKebab.tsx:38](../src/features/staff/components/list/StaffRowKebab.tsx), и в [StaffDetailKebab.tsx:48](../src/features/staff/components/detail/StaffDetailKebab.tsx). Это известное расхождение спека/рантайм — текущий UI разрешает Финансовому менеджеру приглашать/редактировать сотрудников. Решить выравниванием либо матрицы, либо kebab'а.

² **Деструктивные действия по возвратам** — `ROLE_PERMISSIONS.payments.destructive = true` только у Владельца + Финансового менеджера.

---

## 5. Матрица прав по ресурсам (verbatim)

Из [src/types/domain.ts:418-451](../src/types/domain.ts) (`ROLE_PERMISSIONS`). 4 роли × 6 ресурсов × `{read, write, destructive}`.

| Ресурс | Владелец | Финансовый менеджер | Оператор | Наблюдатель |
|---|---|---|---|---|
| **students** | R · W · D | R · W · — | R · W · — | R · — · — |
| **payments** | R · W · D | R · W · D | R · W · — | R · — · — |
| **reports** | R · W · D | R · W · — | R · — · — | R · — · — |
| **staff** | R · W · D | R · — · — | R · — · — | R · — · — |
| **settings** | R · W · D | R · — · — | — · — · — | — · — · — |
| **audit** | R · W · D | R · — · — | — · — · — | — · — · — |

R = чтение · W = запись · D = деструктивное · — = запрещено

---

## 6. Реестр Coming Soon фич

Locked-фичи открываются на `/locked/:feature`. Карта slug → контент в [src/features/coming-soon/data/featureContent.ts](../src/features/coming-soon/data/featureContent.ts) (`FEATURE_REGISTRY`). Зарегистрировано 9 фич; 4 доступны из сайдбара.

| Slug | Есть в сайдбаре? | Откуда линкуется |
|---|:-:|---|
| `documents` | ✓ Секция Студенты | Сайдбар |
| `sms-campaigns` | ✓ Секция Платежи | Сайдбар |
| `ai-insights` | ✓ Секция Финансы | Сайдбар |
| `mobile-app` | ✓ Секция Система | Сайдбар |
| `integrations-hemis` | ✗ | Настройки → Интеграции |
| `integrations-1c` | ✗ | Настройки → Интеграции |
| `multi-currency` | ✗ | Организация → Банковские счета (USD picker) |
| `custom-roles` | ✗ | Настройки → Безопасность или Сотрудники (планируется) |
| `billing-upgrade` | ✗ | Настройки → Тариф (CTA) |

Прямой URL-доступ работает на любой slug; неизвестный slug fallback'ится на универсальную иллюстрацию через `resolveFeature(slug)`.

---

## 7. Auth-поверхности

Eager-loaded для отсутствия вспышки на неавтентифицированном пути ([src/router.tsx:29-31](../src/router.tsx)).

| Маршрут | Компонент | Назначение |
|---|---|---|
| `/sign-in` | `SignInPage` | Email + пароль (DEV: роль из префикса email) |
| `/forgot-password` | `ForgotPasswordPage` | Запрос письма для сброса |
| `/reset-password` | `ResetPasswordPage` | Установка нового пароля по токену из письма |

Сегодня нет выделенных маршрутов MFA, magic-link или SSO. Истечение сессии по неактивности закреплено `useIdleTimeout()` внутри `AuthGuard` ([src/router.tsx:131-134](../src/router.tsx)).

---

## 8. Регламент сопровождения

Обновляйте этот документ при **любом** из следующих изменений:

| Изменение | Что обновить здесь |
|---|---|
| Добавить/удалить маршрут в [src/router.tsx](../src/router.tsx) | Дерево маршрутов §3, матрицу видимости §4 |
| Добавить/удалить элемент сайдбара в [Sidebar.tsx](../src/components/layout/Sidebar.tsx) | Таблицу навигации §2 |
| Добавить/удалить вкладку в любом `*TabsNav.tsx` | Сводку вкладок §3, §4 если role-conditional |
| Изменить `ROLE_PERMISSIONS` в [domain.ts](../src/types/domain.ts) | Матрицу §5, переаудит §4 |
| Добавить новую роль в `Role` | Таблицу ролей §1, колонку §4, колонку §5 |
| Добавить coming-soon фичу в `FEATURE_REGISTRY` | Реестр §6 |
| Добавить route-level guard | Удалить оговорку спека-vs-рантайм в §1, перевести 🟡 ячейки в ✗ |

Проверки перед мерджем:
1. `git grep -nE "path: ['\"]" src/router.tsx | wc -l` должно совпадать со счётом маршрутов в §3.
2. Каждый упомянутый i18n-ключ (например, `nav.section.main`) должен существовать и в [ru.json](../src/lib/i18n/locales/ru.json), и в [uz.json](../src/lib/i18n/locales/uz.json).
3. Запустить `npm run audit:discipline` согласно [STYLE_DISCIPLINE.md](../STYLE_DISCIPLINE.md) §0.9.
