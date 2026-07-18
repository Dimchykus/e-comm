import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1784340000000 implements MigrationInterface {
  name = 'Migration1784340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_logs_channel_enum" AS ENUM('email', 'sms')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('sent', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event" character varying NOT NULL, "user_id" character varying NOT NULL, "channel" "public"."notification_logs_channel_enum" NOT NULL DEFAULT 'email', "message" character varying NOT NULL, "status" "public"."notification_logs_status_enum" NOT NULL DEFAULT 'sent', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_notification_logs_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_logs_user_id" ON "notification_logs" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_logs_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "notification_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."notification_logs_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notification_logs_channel_enum"`,
    );
  }
}
