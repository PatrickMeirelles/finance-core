import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792277243972 implements MigrationInterface {
  name = 'InitialSchema1792277243972';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_type_enum" AS ENUM('cash', 'credit_card', 'checking_account')`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "name" character varying NOT NULL, "type" "public"."accounts_type_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "closing_day" integer, "due_day" integer, "credit_limit" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3000dad1da61b29953f0747632" ON "accounts" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_62471155681515721de014a625" ON "accounts" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_10f04a2e0f991889bb2feb6aeb" ON "accounts" ("user_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."categories_type_enum" AS ENUM('income', 'expensive', 'transfer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "name" character varying NOT NULL, "type" "public"."categories_type_enum" NOT NULL, "icon" character varying, "color" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2296b7fe012d95646fa41921c8" ON "categories" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12e4b7d46758c75d68e3804730" ON "categories" ("user_id", "type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('income', 'expensive', 'transfer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "account_id" integer NOT NULL, "category_id" integer NOT NULL, "value" integer NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL, "transaction_date" TIMESTAMP NOT NULL, "installment" integer NOT NULL, "amount_installments" integer NOT NULL, "installments_group_id" character varying NOT NULL, "destination_account_id" integer, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9acc6efa76de013e8c1553ed2" ON "transactions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49c0d6e8ba4bfb5582000d851f" ON "transactions" ("account_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c32e9738cd3cb3fdd25e10fd7" ON "transactions" ("user_id", "transaction_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "full_name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users_tokens" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "access_token_hash" character varying NOT NULL, "expires_at_access_token" TIMESTAMP NOT NULL, "refresh_token_hash" character varying NOT NULL, "expires_at_refresh_token" TIMESTAMP NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f236389174a6ccbd746f53dca8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32f96022cc5076fe565a5cba20" ON "users_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_92f35ed4dd47b0b4f0eda72114" ON "users_tokens" ("access_token_hash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d5a7dd9c23656b7996dbecbc1" ON "users_tokens" ("expires_at_access_token") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_85d8863f411141420a9549ba50" ON "users_tokens" ("refresh_token_hash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_resets" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4816377aa98211c1de34469e742" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7a4c3bc48f24df007936d217b" ON "password_resets" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49f39bd47382585468191d33b5" ON "password_resets" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_active" ON "password_resets" ("expires_at", "used_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_2296b7fe012d95646fa41921c8b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_tokens" ADD CONSTRAINT "FK_32f96022cc5076fe565a5cba20b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_tokens" DROP CONSTRAINT "FK_32f96022cc5076fe565a5cba20b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_2296b7fe012d95646fa41921c8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_password_reset_active"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_49f39bd47382585468191d33b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7a4c3bc48f24df007936d217b"`,
    );
    await queryRunner.query(`DROP TABLE "password_resets"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_85d8863f411141420a9549ba50"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8d5a7dd9c23656b7996dbecbc1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92f35ed4dd47b0b4f0eda72114"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32f96022cc5076fe565a5cba20"`,
    );
    await queryRunner.query(`DROP TABLE "users_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1c32e9738cd3cb3fdd25e10fd7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_49c0d6e8ba4bfb5582000d851f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9acc6efa76de013e8c1553ed2"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12e4b7d46758c75d68e3804730"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2296b7fe012d95646fa41921c8"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TYPE "public"."categories_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_10f04a2e0f991889bb2feb6aeb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_62471155681515721de014a625"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3000dad1da61b29953f0747632"`,
    );
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_type_enum"`);
  }
}
