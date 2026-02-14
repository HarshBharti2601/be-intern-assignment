import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateLikeTable1713427400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'likes',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'postId',
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
      'likes',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'likes',
      new TableForeignKey({
        columnNames: ['postId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createUniqueConstraint(
      'likes',
      new TableUnique({
        name: 'UQ_likes_userId_postId',
        columnNames: ['userId', 'postId'],
      })
    );

    await queryRunner.createIndex(
      'likes',
      new TableIndex({
        name: 'idx_like_post',
        columnNames: ['postId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('likes');
  }
}