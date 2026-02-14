import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateFollowTable1713427500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'followerId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'followingId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['followerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['followingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createUniqueConstraint(
      'follows',
      new TableUnique({
        name: 'UQ_follows_followerId_followingId',
        columnNames: ['followerId', 'followingId'],
      })
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'idx_follow_following',
        columnNames: ['followingId'],
      })
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'idx_follow_follower',
        columnNames: ['followerId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('follows');
  }
}