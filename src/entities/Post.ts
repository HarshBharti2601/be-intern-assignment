import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Like } from './Like';
import { Hashtag } from './Hashtag';

@Entity('posts')
@Index('idx_post_author', ['authorId'])
@Index('idx_post_created', ['createdAt'])
export class Post {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'integer' })
  authorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.post, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Like, (like) => like.post, { cascade: true })
  likes: Like[];

  @ManyToMany(() => Hashtag, (hashtag) => hashtag.posts)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hashtagId', referencedColumnName: 'id' },
  })
  hashtags: Hashtag[];
}