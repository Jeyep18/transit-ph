# TransitPH Business Rules Document

**Ateneo de Naga University | [cite_start]College of Computer Studies** [cite: 1]
[cite_start]**Backend Reference | v1.0** [cite: 4]

---

## 1. Introduction and Document Purpose

[cite_start]This document defines the Business Rules governing the TransitPH web application, serving as the primary specification for the backend PostgreSQL database[cite: 6, 8].

- [cite_start]**Scope:** All public-facing user account functionality (registration, login, profiles, etc.) has been removed[cite: 9, 14, 15].
- [cite_start]**Authentication:** The sole authenticated role in the system is the **Administrator**[cite: 11, 33].
- [cite_start]**Core Value:** The system provides route discovery and automatic fare computation for anonymous visitors[cite: 12].
- [cite_start]**Data Model:** The database reflects a system with no public user entity[cite: 21].

### [cite_start]Core Entities [cite: 24]

| Entity             | Table Name       | Purpose                                                                          |
| :----------------- | :--------------- | :------------------------------------------------------------------------------- |
| **Administrator**  | `admin`          | [cite_start]Authenticated system managers[cite: 24].                             |
| **Transport Mode** | `transport_mode` | [cite_start]Vehicle classification (Jeepney only)[cite: 24].                     |
| **Station**        | `station`        | [cite_start]Named, geo-positioned loading/unloading points[cite: 24].            |
| **Route**          | `route`          | [cite_start]Ordered path served by a transport mode between terminals[cite: 24]. |
| **Route Station**  | `route_station`  | [cite_start]Junction mapping of stations within a route[cite: 24].               |
| **Fare Matrix**    | `fare_matrix`    | [cite_start]Regulatory fare structure per transport mode[cite: 24].              |

---

## [cite_start]2. System-Wide Rules [cite: 27]

| Rule ID       | Business Rule                                                                                      | ERD/Implementation Guidance                                             |
| :------------ | :------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **BR-SYS-01** | [cite_start]No account creation or login required for public route search/fare features[cite: 29]. | [cite_start]No public user table[cite: 29].                             |
| **BR-SYS-02** | [cite_start]The only authenticated role is the Administrator[cite: 29].                            | [cite_start]Simple auth model; no role hierarchy[cite: 29].             |
| **BR-SYS-03** | [cite_start]Public data is read-only for anonymous users[cite: 29].                                | [cite_start]No write endpoints on public API[cite: 29].                 |
| **BR-SYS-04** | [cite_start]No collection of PII (IPs, cookies, identifiers) from anonymous users[cite: 29].       | [cite_start]No user tracking or analytics tables[cite: 29].             |
| **BR-SYS-05** | [cite_start]Route search queries must not be logged or stored[cite: 29].                           | [cite_start]No `search_log` or `query_history` tables[cite: 29].        |
| **BR-SYS-06** | [cite_start]All primary keys must be system-generated (SERIAL/BIGSERIAL or UUID)[cite: 29].        | [cite_start]Informs PK column choices[cite: 29].                        |
| **BR-SYS-07** | [cite_start]All timestamps must be stored in UTC[cite: 29].                                        | [cite_start]Use `TIMESTAMP WITH TIME ZONE`[cite: 29].                   |
| **BR-SYS-08** | [cite_start]Soft deletion via `is_active` boolean is required for major entities[cite: 29].        | [cite_start]Hard deletion prohibited for relational entities[cite: 29]. |
| **BR-SYS-09** | [cite_start]All write operations must record the Admin ID in an `updated_by` column[cite: 29].     | [cite_start]FK column referencing `admin.id`[cite: 29].                 |
| **BR-SYS-10** | [cite_start]Foreign key constraints must be enforced at the database level[cite: 29].              | [cite_start]Use `FOREIGN KEY REFERENCES` with `ON DELETE`[cite: 29].    |

---

## [cite_start]3. Administrator Account Rules [cite: 30]

- [cite_start]**Uniqueness:** Admins must have unique usernames and email addresses[cite: 34].
- [cite_start]**Security:** Passwords must be hashed (Bcrypt/Argon2); plaintext storage is prohibited[cite: 34, 40].
- [cite_start]**Complexity:** Minimum 8 characters, including one uppercase, one lowercase, and one digit[cite: 34].
- [cite_start]**Management:** Accounts are created by existing admins or seeding; they can be deactivated but never deleted to preserve audit trails[cite: 34].
- [cite_start]**Availability:** At least one active admin must exist; the last admin cannot deactivate themselves[cite: 34].
- [cite_start]**Sessions:** Tokens (JWT) must expire after 60 minutes of inactivity[cite: 34].

### [cite_start]Admin Attribute Specification [cite: 37, 40]

| Field           | Data Type    | Constraints             | Description                               |
| :-------------- | :----------- | :---------------------- | :---------------------------------------- |
| `id`            | BIGSERIAL    | PK, NOT NULL            | [cite_start]Unique identifier[cite: 37].  |
| `username`      | VARCHAR(80)  | UNIQUE, NOT NULL        | [cite_start]Login name[cite: 37].         |
| `email`         | VARCHAR(254) | UNIQUE, NOT NULL        | [cite_start]Unique email[cite: 37].       |
| `password_hash` | VARCHAR(255) | NOT NULL                | [cite_start]Bcrypt/Argon2 hash[cite: 40]. |
| `is_active`     | BOOLEAN      | NOT NULL, DEFAULT TRUE  | [cite_start]Soft-deletion flag[cite: 40]. |
| `created_at`    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() | [cite_start]Creation timestamp[cite: 40]. |
| `last_login_at` | TIMESTAMPTZ  | NULL                    | [cite_start]Most recent login[cite: 40].  |

---

## [cite_start]4. Transport Mode Rules [cite: 41]

- [cite_start]**Scope:** The only valid transport mode is **Jeepney (JEP)**[cite: 44]. [cite_start]Bus and UV Express are out of scope[cite: 44].
- **Constraints:**
  - [cite_start]Short code "JEP" must be unique and $\le 10$ characters[cite: 44].
  - [cite_start]A mode cannot be deactivated if active routes are associated with it[cite: 44].
  - [cite_start]Each mode must have exactly one active Fare Matrix record for computations[cite: 44].

---

## [cite_start]5. Station Rules [cite: 49]

- [cite_start]**Geography:** Each station requires a unique name and NOT NULL latitude/longitude coordinates[cite: 52].
- **Coordinate Range:** Latitude must be between $-90.000000$ and $90.000000$; [cite_start]Longitude between $-180.000000$ and $180.000000$[cite: 52].
- [cite_start]**Proximity:** System must reject new stations within 50 meters of an existing active station (Haversine $< 0.05$ km)[cite: 52].
- **Types:**
  - [cite_start]`JEEPNEY_STOP`: Eligible for route assignment[cite: 55, 58].
  - [cite_start]`TRICYCLE_TERMINAL`: Connection advisory only; cannot belong to a route sequence or serve as a route terminal[cite: 55].

---

## [cite_start]6. Route Rules [cite: 62]

- [cite_start]**Definition:** A directional path with a unique alphanumeric code and human-readable name[cite: 63, 64].
- **Structure:**
  - [cite_start]Must associate with exactly one transport mode[cite: 64].
  - [cite_start]Must have distinct origin and terminal stations[cite: 64].
  - [cite_start]Minimum of two stations per route (origin and terminal)[cite: 64].
- [cite_start]**Validation:** Route codes must be uppercase alphanumeric and may include hyphens, but no spaces or special characters[cite: 64].

---

## [cite_start]7. Route-Station Association Rules [cite: 71]

- [cite_start]**Integrity:** Each record links one route to one station[cite: 74]. [cite_start]A station cannot appear twice in the same route[cite: 74].
- **Sequencing:**
  - [cite_start]`sequence_order` must be a positive integer starting at 1[cite: 74].
  - [cite_start]Sequences must be continuous and gap-free; the system must re-sequence on station deletion[cite: 74, 77].
  - [cite_start]$Order = 1$ must be the `origin_station_id`; the highest order must be the `terminal_station_id`[cite: 77].
- [cite_start]**Distance:** `distance_from_prev_km` stores the road distance from the previous station[cite: 77, 80].

---

## [cite_start]8. Fare Matrix Rules [cite: 82]

- [cite_start]**Structure:** Each matrix defines a base fare (PHP), base distance (km), and incremental rate (PHP per km)[cite: 87].
- [cite_start]**Activation:** Only one fare matrix per transport mode can be active[cite: 88]. [cite_start]Activating a new one automatically deactivates the previous record[cite: 89].
- **Monetary Rules:**
  - [cite_start]Base fare and base distance must be $> 0$[cite: 91, 92].
  - [cite_start]Incremental rate must be $\ge 0$[cite: 93].

---

## [cite_start]9. Search and Fare Computation Rules [cite: 101, 118]

- [cite_start]**Query Requirements:** Valid searches need an origin and destination (station name or coordinates)[cite: 104, 106].
- **Filtering:** Only active stations and routes are included; [cite_start]Jeepney is the exclusive mode[cite: 108, 113].
- [cite_start]**Ranking:** Results can be sorted by lowest fare, fewest transfers, or shortest travel time[cite: 111].
- **Fare Logic:**
  - [cite_start]Total trip fare is the sum of individual leg fares[cite: 121].
  - [cite_start]All fares must be rounded to two decimal places[cite: 123, 124].
  - [cite_start]If Haversine distance is used as a fallback, the fare must be flagged as an estimate (`is_estimated: true`)[cite: 118, 120].
  - [cite_start]Tricycle connections have no computed fare; they display a static advisory[cite: 127, 128].

---

## [cite_start]10. Integration and Database Integrity [cite: 129]

- [cite_start]**Precision:** Geographic coordinates must use `DECIMAL(9,6)` for $\approx 0.11$ meter resolution[cite: 129, 130].
- [cite_start]**Transactions:** All write operations for core tables must be executed within database transactions[cite: 130, 131].
- [cite_start]**Automation:** `updated_at` timestamps must refresh automatically on record modification (PostgreSQL trigger or Django `auto_now`)[cite: 133, 134].
- **Relationships:**
  - [cite_start]`admin` $\rightarrow$ `route/station/fare_matrix` ($1:N$ via `updated_by`)[cite: 139, 140, 143].
  - [cite_start]`transport_mode` $\rightarrow$ `route` ($1:N$)[cite: 141].
  - [cite_start]`station` $\rightarrow$ `route` ($1:N$ for origin and terminal)[cite: 143, 144].

---

[cite_start]**— End of Business Rules Document —** [cite: 146]
