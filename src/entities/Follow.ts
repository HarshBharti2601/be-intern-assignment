import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('follows')
@Unique(['followerId', 'followingId'])
@Index('idx_follow_following', ['followingId'])
@Index('idx_follow_follower', ['followerId'])
export class Follow {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid' })
  followerId: string;

  @Column({ type: 'uuid' })
  followingId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.following)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @ManyToOne(() => User, (user) => user.followers)
  @JoinColumn({ name: 'followingId' })
  followingUser: User;
}