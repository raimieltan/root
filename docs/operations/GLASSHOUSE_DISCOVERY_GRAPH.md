# Operation Glasshouse — Discovery Graph

This is the authoring audit for the player-visible facts required to complete Glasshouse. A fact may be stored in scenario content, but it must also have at least one in-world source below. Commands are examples of interfaces that can reveal facts; they are not progression keys.

## Public boundary

| Fact | Discoverable from | Alternative discovery | Required for |
| --- | --- | --- | --- |
| `WEB-01` / `10.10.10.10` | Authorized engagement scope and Network Map | Hosts view in Assisted mode | Initial reconnaissance |
| TCP 22/80/443 | `nmap` of WEB-01 | Network service inspection | Identifying SSH and HTTP(S) |
| `portal.meridian.test` | HTTP 302 `Location` returned by WEB-01's IP | Canonical-host response metadata | Addressing the Meridian portal |
| `/legacy-upload` | Portal HTML form `action` | Page-source inspection | Addressing the legacy interface |
| HTTP `POST` | Portal HTML form `method` | Form/request inspection | Choosing the request method |
| Form field `upload` | Portal HTML select `name` | Form/request inspection | Constructing the request body |
| Value `archive` | Portal HTML option `value` and label | Form UI selection | Selecting the archive workflow |
| `/api/profile` | Link on the portal homepage | Page-source inspection | Discovering remote-access relationships |
| `vpn.meridian.test` / `VPN-01` | JSON returned by `/api/profile` | Published support profile | Addressing remote access |
| `fieldops` | JSON returned by `/api/profile` | Credential Findings after profile inspection | Authenticating to VPN-01 |
| `FieldOps-ReadOnly` | JSON returned by `/api/profile` | Credential Findings reveal action | Authenticating to VPN-01 |

## Application chain

| Fact | Discoverable from | Alternative discovery | Required for |
| --- | --- | --- | --- |
| Web worker runs as `www-data` | Successful legacy form submission and resulting session | Process/session telemetry | Investigating WEB-01 |
| `/var/www/meridian/app.conf` | `ls`/`find` on the web session | Files application | Finding deployment configuration |
| `DEV_HOST=10.20.10.20` / `DEV-01` | `app.conf` contents | Search of readable configuration | Addressing the deployment host |
| `DEPLOY_USER=deploy` | `app.conf` contents | Credential Findings | Authenticating to DEV-01 |
| Deploy password | `app.conf` contents | Credential Findings reveal action | Authenticating to DEV-01 |
| `deploy` belongs to `backup` | `id` on DEV-01 | Session identity view | Understanding service permissions |
| `backup-sync` runs as root | `ps` on DEV-01 | Processes application | Recognizing the privileged service |
| `/etc/backup-sync.conf` | Full backup-sync process command line | Process inspection | Locating service configuration |
| `RUN_HOOK=/opt/backup/run.sh` | Reading or searching `backup-sync.conf` | Files application | Understanding the trusted hook |
| `MANUAL_TRIGGER=backup-sync --run-hook` | Reading or searching `backup-sync.conf` | Generic `help backup-sync` after discovering the service | Invoking the maintenance interface |
| Hook ownership and writability | `ls -l /opt/backup/run.sh` | Files application | Understanding why deploy can influence it |
| `/etc/meridian/routes.conf` | `ROUTES_CONFIG` in `backup-sync.conf` | Search of service configuration | Locating the finance relationship |
| `FIN-APP` / `10.30.10.20:443` | `routes.conf` | Search of readable route configuration | Addressing the finance application |
| `svc_web` | `routes.conf` | Credential Findings | Authenticating to FIN-APP |
| Finance service token | `routes.conf` | Credential Findings reveal action | Authenticating to FIN-APP |
| `/etc/fin-app/db.conf` | Full `fin-api` process command line | Process inspection | Locating database configuration |
| `FIN-DB` / `10.30.10.21:5432` | `db.conf` | PostgreSQL service enumeration from FIN-APP | Addressing PostgreSQL |
| `finance_app` | `db.conf` | Credential Findings | Authenticating to PostgreSQL |
| Finance database password | `db.conf` | Credential Findings reveal action | Authenticating to PostgreSQL |
| Database name `finance` | PostgreSQL `\l` | `DB_NAME=finance` in `db.conf` | Selecting the database |

## Backup-trust chain

| Fact | Discoverable from | Alternative discovery | Required for |
| --- | --- | --- | --- |
| `/etc/vpn/backup-peers.conf` | `ls`/`find` after the fieldops login | Files application | Finding the peer relationship |
| `BACKUP-01` | VPN peer configuration | Search of readable VPN configuration | Addressing the backup host |
| `backup_svc` | VPN peer configuration | Credential Findings | Authenticating to BACKUP-01 |
| Backup service token | VPN peer configuration | Credential Findings reveal action | Authenticating to BACKUP-01 |
| `/etc/backup/finance-db.conf` | `ls`/`find` on BACKUP-01 | Files application | Finding database trust configuration |
| `FIN-DB` | Finance backup configuration | Search of readable backup configuration | Addressing PostgreSQL |
| `db_backup` | Finance backup configuration | Credential Findings | Authenticating through backup trust |
| Backup database token | Finance backup configuration | Credential Findings reveal action | Authenticating through backup trust |

## PostgreSQL and objective

| Fact | Discoverable from | Alternative discovery | Required for |
| --- | --- | --- | --- |
| Available psql commands | `\?` | Generic `help psql` | Learning database inspection |
| Database `finance` | `\l` | Application configuration | Selecting the database |
| Table `public.documents` | `\dt` after selecting `finance` | None required | Locating mission evidence |
| Columns `filename`, `classification` | `\d documents` | `SELECT *` remains valid but is unnecessary | Constructing a bounded query |
| `PROJECT_ATLAS.pdf` is confidential | Querying discovered columns in `documents` | Direct file inspection after authorized FIN-DB access | Satisfying the objective |
| Objective path `/opt/db/data/PROJECT_ATLAS.pdf` | Objective retrieval event/database row mapping | FIN-DB file listing for a shell route | Recording extraction in authoritative state |

## Semantic event graph

```text
Player command or UI intent
  -> parsed simulation action
  -> service/file/process/database behavior
  -> FACT_DISCOVERED / security telemetry
  -> authoritative scenario state
  -> Known/Unknown guidance, mission outcome, replay, and Blue correlation
```

`cat`, `less`, and matching `grep` reads all drive the same file discovery. `curl -X POST ... --data upload=archive` and `curl --data upload=archive ...` produce the same semantic HTTP request. PostgreSQL progression is based on the database and schema information revealed, not on an exact query string.
