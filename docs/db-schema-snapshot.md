# Database Schema Snapshot

**Generated**: 2026-01-09  
**Source**: PostgreSQL container inspection via `\d+` commands

## Tables Overview

```
 Schema |  Name  | Type  |     Owner      
--------+--------+-------+----------------
 public | clicks | table | shortener_user
 public | urls   | table | shortener_user
 public | users  | table | shortener_user
```

---

## Table: `users`

### Columns

| Column        | Type                        | Nullable | Default                           | Indexes          |
|---------------|-----------------------------|----------|-----------------------------------|------------------|
| id            | integer                     | NOT NULL | nextval('users_id_seq'::regclass) | PRIMARY KEY, btree |
| email         | character varying           | NOT NULL |                                   | UNIQUE (ix_users_email) |
| password_hash | character varying           | NOT NULL |                                   |                  |
| plan          | character varying           | NULL     |                                   |                  |
| is_active     | boolean                     | NULL     |                                   |                  |
| created_at    | timestamp without time zone | NULL     |                                   |                  |

### Indexes

- `users_pkey` PRIMARY KEY, btree (id)
- `ix_users_email` UNIQUE, btree (email)
- `ix_users_id` btree (id)

---

## Table: `urls`

### Columns

| Column     | Type                        | Nullable | Default                          | Indexes          |
|------------|-----------------------------|----------|----------------------------------|------------------|
| id         | integer                     | NOT NULL | nextval('urls_id_seq'::regclass) | PRIMARY KEY, btree |
| short_code | character varying(16)       | NULL     |                                  | UNIQUE (ix_urls_short_code) |
| long_url   | character varying           | NOT NULL |                                  |                  |
| created_at | timestamp without time zone | NULL     |                                  |                  |
| expires_at | timestamp without time zone | NULL     |                                  |                  |
| is_active  | boolean                     | NULL     |                                  |                  |

### Indexes

- `urls_pkey` PRIMARY KEY, btree (id)
- `ix_urls_id` btree (id)
- `ix_urls_short_code` UNIQUE, btree (short_code)

### Foreign Keys

None

### Referenced By

- TABLE `clicks` CONSTRAINT `clicks_url_id_fkey` FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE

---

## Table: `clicks`

### Columns

| Column     | Type                        | Nullable | Default                            | Indexes          |
|------------|-----------------------------|----------|------------------------------------|------------------|
| id         | integer                     | NOT NULL | nextval('clicks_id_seq'::regclass) | PRIMARY KEY, btree |
| url_id     | integer                     | NOT NULL |                                    | FK to urls(id)   |
| event_time | timestamp without time zone | NULL     |                                    | ix_clicks_event_time |
| country    | character varying(2)        | NULL     |                                    |                  |
| referrer   | character varying           | NULL     |                                    |                  |
| user_agent | character varying           | NULL     |                                    |                  |

### Indexes

- `clicks_pkey` PRIMARY KEY, btree (id)
- `ix_clicks_event_time` btree (event_time)
- `ix_clicks_id` btree (id)

### Foreign Keys

- `clicks_url_id_fkey` FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
