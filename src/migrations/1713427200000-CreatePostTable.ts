import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePostTable1713427300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'authorId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'posts',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'idx_post_author',
        columnNames: ['authorId'],
      })
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'idx_post_created',
        columnNames: ['createdAt'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('posts');
  }
}