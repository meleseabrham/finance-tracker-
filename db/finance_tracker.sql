-- Adminer 5.4.2 PostgreSQL 16.15 dump

\connect "finance_tracker";

DROP TABLE IF EXISTS "budgets";
DROP SEQUENCE IF EXISTS "public".budgets_id_seq;
CREATE SEQUENCE "public".budgets_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."budgets" (
    "id" integer DEFAULT nextval('budgets_id_seq') NOT NULL,
    "user_id" integer,
    "category_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "period" character varying(20) DEFAULT 'monthly' NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "budgets_period_check" CHECK ((((period)::text = ANY ((ARRAY['weekly'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[]))))
)
WITH (oids = false);

INSERT INTO "budgets" ("id", "user_id", "category_id", "amount", "period", "start_date", "end_date", "created_at", "updated_at") VALUES
(1,	1,	34,	6000.00,	'monthly',	'2026-11-10',	'2026-12-10',	'2026-11-10 07:01:42.97166+00',	'2026-11-10 07:01:42.97166+00');

DROP TABLE IF EXISTS "categories";
DROP SEQUENCE IF EXISTS "public".categories_id_seq;
CREATE SEQUENCE "public".categories_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."categories" (
    "id" integer DEFAULT nextval('categories_id_seq') NOT NULL,
    "user_id" integer,
    "name" character varying(100) NOT NULL,
    "type" character varying(10) NOT NULL,
    "color" character varying(20) DEFAULT '#6366f1',
    "icon" character varying(50) DEFAULT 'tag',
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_type_check" CHECK ((((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[]))))
)
WITH (oids = false);

INSERT INTO "categories" ("id", "user_id", "name", "type", "color", "icon", "created_at") VALUES
(1,	1,	'Salary',	'income',	'#10b981',	'briefcase',	'2026-11-09 16:39:42.113081+00'),
(2,	1,	'Freelance',	'income',	'#06b6d4',	'laptop',	'2026-11-09 16:39:42.115624+00'),
(3,	1,	'Investment',	'income',	'#8b5cf6',	'trending-up',	'2026-11-09 16:39:42.116937+00'),
(4,	1,	'Food & Dining',	'expense',	'#f59e0b',	'utensils',	'2026-11-09 16:39:42.118143+00'),
(5,	1,	'Transport',	'expense',	'#3b82f6',	'car',	'2026-11-09 16:39:42.119494+00'),
(6,	1,	'Shopping',	'expense',	'#ec4899',	'shopping-bag',	'2026-11-09 16:39:42.120889+00'),
(7,	1,	'Bills & Utilities',	'expense',	'#ef4444',	'zap',	'2026-11-09 16:39:42.122277+00'),
(8,	1,	'Entertainment',	'expense',	'#f97316',	'film',	'2026-11-09 16:39:42.123759+00'),
(9,	1,	'Health',	'expense',	'#14b8a6',	'heart',	'2026-11-09 16:39:42.125363+00'),
(10,	1,	'Education',	'expense',	'#6366f1',	'book',	'2026-11-09 16:39:42.12687+00'),
(34,	1,	'House Rent',	'expense',	'#f97316',	'house',	'2026-11-10 06:58:41.161626+00');

DROP TABLE IF EXISTS "currencies";
DROP SEQUENCE IF EXISTS "public".currencies_id_seq;
CREATE SEQUENCE "public".currencies_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."currencies" (
    "id" integer DEFAULT nextval('currencies_id_seq') NOT NULL,
    "user_id" integer,
    "code" character varying(10) NOT NULL,
    "name" character varying(100) NOT NULL,
    "symbol" character varying(10) DEFAULT '',
    "color" character varying(20) DEFAULT '#6366f1',
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX currencies_user_id_code_key ON public.currencies USING btree (user_id, code);

INSERT INTO "currencies" ("id", "user_id", "code", "name", "symbol", "color", "created_at", "updated_at") VALUES
(1,	1,	'USD',	'US Dollar',	'$',	'#10b981',	'2026-11-10 06:17:45.440432+00',	'2026-11-10 06:17:45.440432+00'),
(2,	1,	'EUR',	'Euro',	'€',	'#3b82f6',	'2026-11-10 06:17:45.440432+00',	'2026-11-10 06:17:45.440432+00'),
(3,	1,	'GBP',	'British Pound',	'£',	'#8b5cf6',	'2026-11-10 06:17:45.440432+00',	'2026-11-10 06:17:45.440432+00'),
(4,	1,	'JPY',	'Japanese Yen',	'¥',	'#f59e0b',	'2026-11-10 06:17:45.440432+00',	'2026-11-10 06:17:45.440432+00'),
(5,	1,	'CAD',	'Canadian Dollar',	'C$',	'#ef4444',	'2026-11-10 06:17:45.440432+00',	'2026-11-10 06:17:45.440432+00'),
(6,	1,	'AUD',	'Australian Dollar',	'A$',	'#06b6d4',	'2026-11-10 06:17:45.440432+00',	'2026-11-10 06:17:45.440432+00'),
(7,	1,	'INR',	'Indian Rupee',	'₹',	'#ec4899',	'2026-11-10 06:17:45.440432+00',	'2026-11-10 06:17:45.440432+00'),
(9,	1,	'ETB',	'Ethiopian Birr',	'Br',	'#abad00',	'2026-11-10 06:25:09.094769+00',	'2026-11-10 06:25:21.610017+00');

DROP TABLE IF EXISTS "savings_contributions";
DROP SEQUENCE IF EXISTS "public".savings_contributions_id_seq;
CREATE SEQUENCE "public".savings_contributions_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."savings_contributions" (
    "id" integer DEFAULT nextval('savings_contributions_id_seq') NOT NULL,
    "goal_id" integer,
    "user_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "note" character varying(255),
    "date" date DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "savings_contributions_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

INSERT INTO "savings_contributions" ("id", "goal_id", "user_id", "amount", "note", "date", "created_at") VALUES
(1,	1,	1,	3000.00,	'freelance',	'2026-11-10',	'2026-11-10 06:54:07.717042+00');

DROP TABLE IF EXISTS "savings_goals";
DROP SEQUENCE IF EXISTS "public".savings_goals_id_seq;
CREATE SEQUENCE "public".savings_goals_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."savings_goals" (
    "id" integer DEFAULT nextval('savings_goals_id_seq') NOT NULL,
    "user_id" integer,
    "name" character varying(150) NOT NULL,
    "target_amount" numeric(12,2) NOT NULL,
    "current_amount" numeric(12,2) DEFAULT '0',
    "target_date" date,
    "color" character varying(20) DEFAULT '#10b981',
    "icon" character varying(50) DEFAULT 'piggy-bank',
    "status" character varying(20) DEFAULT 'active',
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "savings_goals_status_check" CHECK ((((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))))
)
WITH (oids = false);

INSERT INTO "savings_goals" ("id", "user_id", "name", "target_amount", "current_amount", "target_date", "color", "icon", "status", "created_at", "updated_at") VALUES
(1,	1,	'test goal',	100000.00,	3000.00,	'2026-12-10',	'#10b981',	'piggy-bank',	'active',	'2026-11-10 06:52:45.620233+00',	'2026-11-10 06:54:07.728516+00');

DROP TABLE IF EXISTS "transactions";
DROP SEQUENCE IF EXISTS "public".transactions_id_seq;
CREATE SEQUENCE "public".transactions_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."transactions" (
    "id" integer DEFAULT nextval('transactions_id_seq') NOT NULL,
    "user_id" integer,
    "category_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "type" character varying(10) NOT NULL,
    "description" character varying(255),
    "date" date DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transactions_type_check" CHECK ((((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[]))))
)
WITH (oids = false);

INSERT INTO "transactions" ("id", "user_id", "category_id", "amount", "type", "description", "date", "created_at", "updated_at") VALUES
(1,	1,	1,	15000.00,	'income',	'from INSA',	'2026-11-30',	'2026-11-10 07:02:32.471747+00',	'2026-11-10 07:02:32.471747+00'),
(2,	1,	34,	6000.00,	'expense',	'bet kiray',	'2026-12-10',	'2026-11-10 07:03:14.114106+00',	'2026-11-10 07:03:14.114106+00'),
(3,	1,	4,	4000.00,	'expense',	'food',	'2026-12-10',	'2026-11-10 07:04:12.918646+00',	'2026-11-10 07:04:19.541116+00');

DROP TABLE IF EXISTS "users";
DROP SEQUENCE IF EXISTS "public".users_id_seq;
CREATE SEQUENCE "public".users_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."users" (
    "id" integer DEFAULT nextval('users_id_seq') NOT NULL,
    "name" character varying(100) NOT NULL,
    "email" character varying(150) NOT NULL,
    "password" character varying(255) NOT NULL,
    "currency" character varying(10) DEFAULT 'USD',
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

INSERT INTO "users" ("id", "name", "email", "password", "currency", "created_at", "updated_at") VALUES
(1,	'Melese',	'melese@fintrack.com',	'$2a$12$GCXJaSOV5PZ4AVbepmu5seE.QdljXnS3ioXLLk/LNNjLGmokMyJTq',	'ETB',	'2026-11-09 16:39:42.105224+00',	'2026-11-10 07:25:04.063138+00');

ALTER TABLE ONLY "public"."budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."currencies" ADD CONSTRAINT "currencies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."savings_contributions" ADD CONSTRAINT "savings_contributions_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."savings_contributions" ADD CONSTRAINT "savings_contributions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2026-11-10 07:37:00 UTC
