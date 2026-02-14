import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreatePostHashtagTable1713427700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'post_hashtags',
        columns: [
          {
            name: 'postId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'hashtagId',
            type: 'integer',
            isNullable: false,
          },
        ],
      }),
      true
    );

    await queryRunner.createPrimaryKey(
      'post_hashtags',
      ['postId', 'hashtagId']
    );

    await queryRunner.createForeignKey(
      'post_hashtags',
      new TableForeignKey({
        columnNames: ['postId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'post_hashtags',
      new TableForeignKey({
        columnNames: ['hashtagId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'hashtags',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'post_hashtags',
      new TableIndex({
        name: 'idx_post_hashtags_post',
        columnNames: ['postId'],
      })
    );

    await queryRunner.createIndex(
      'post_hashtags',
      new TableIndex({
        name: 'idx_post_hashtags_hashtag',
        columnNames: ['hashtagId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('post_hashtags');
  }
}