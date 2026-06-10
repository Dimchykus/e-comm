import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780664461471 implements MigrationInterface {
  name = 'InitialSchema1780664461471';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('active', 'draft', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text NOT NULL, "short_description" text, "price" numeric(10,2) NOT NULL, "compare_at_price" numeric(10,2), "cost_price" numeric(10,2), "sku" character varying, "barcode" character varying, "stock" integer NOT NULL DEFAULT '0', "low_stock_threshold" integer NOT NULL DEFAULT '5', "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "category" character varying, "brand" character varying, "weight_grams" integer, "images" jsonb NOT NULL DEFAULT '[]', "tags" text, "meta_title" character varying, "meta_description" text, "is_featured" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"), CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_464f927ae360106b783ed0b410" ON "products"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products"  ("sku") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_464f927ae360106b783ed0b410"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
  }
}
