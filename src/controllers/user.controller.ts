import { Request, Response } from 'express';
import { User } from '../entities/User';
import { Post } from '../entities/Post';
import { Like } from '../entities/Like';
import { Follow } from '../entities/Follow';
import { AppDataSource } from '../data-source';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private postRepository = AppDataSource.getRepository(Post);
  private likeRepository = AppDataSource.getRepository(Like);
  private followRepository = AppDataSource.getRepository(Follow);

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await this.userRepository.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const user = await this.userRepository.findOneBy({
        id: parseInt(req.params.id),
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const user = this.userRepository.create(req.body);
      const result = await this.userRepository.save(user);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const user = await this.userRepository.findOneBy({
        id: parseInt(req.params.id),
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      this.userRepository.merge(user, req.body);
      const result = await this.userRepository.save(user);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', error });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const result = await this.userRepository.delete(parseInt(req.params.id));
      if (result.affected === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error });
    }
  }

  async getUserFollowers(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { limit = 10, offset = 0 } = req.query;

      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const [followers, totalFollowers] = await this.followRepository.findAndCount({
        where : {followingId: userId.toString()},
        relations: ['follower'],
        order: { createdAt: 'DESC' },
        take: Number(limit),
        skip: Number(offset),
      });

      const followerProfiles = followers.map((follow) => ({
        id: follow.follower.id,
        firstName: follow.follower.firstName,
        lastName: follow.follower.lastName,
        email: follow.follower.email,
        followedAt: follow.createdAt,
      }));

      res.json({
        userId: userId,
        totalFollowers: totalFollowers,
        followers: followerProfiles,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching followers', error });
    }
  };
  async getUserActivity(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { activityType, startDate, endDate, limit = 20, offset = 0 } = req.query;

      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const activity = [];
      if (!activityType || activityType === 'post') {
        const postsQuery = this.postRepository
          .createQueryBuilder('post')
          .where('post.authorId = :userId', { userId });

        if (startDate) {
          postsQuery.andWhere('post.createdAt >= :startDate', {
            startDate: new Date(startDate as string),
          });
        }
        if (endDate) {
          postsQuery.andWhere('post.createdAt <= :endDate', {
            endDate: new Date(endDate as string),
          });
        }

        const posts = await postsQuery.orderBy('post.createdAt', 'DESC').getMany();
        activity.push(
          ...posts.map((post) => ({
            type: 'post',
            data: post,
            timestamp: post.createdAt,
          }))
        );
      }

      if (!activityType || activityType === 'like') {
        const likesQuery = this.likeRepository
          .createQueryBuilder('like')
          .leftJoinAndSelect('like.post', 'post')
          .where('like.userId = :userId', { userId });

        if (startDate) {
          likesQuery.andWhere('like.createdAt >= :startDate', {
            startDate: new Date(startDate as string),
          });
        }
        if (endDate) {
          likesQuery.andWhere('like.createdAt <= :endDate', {
            endDate: new Date(endDate as string),
          });
        }

        const likes = await likesQuery.orderBy('like.createdAt', 'DESC').getMany();
        activity.push(
          ...likes.map((like) => ({
            type: 'like',
            data: {
              postId: like.post.id,
              postContent: like.post.content,
            },
            timestamp: like.createdAt,
          }))
        );
      }

      if (!activityType || activityType === 'follow') {
        const followsQuery = this.followRepository
          .createQueryBuilder('follow')
          .leftJoinAndSelect('follow.followingUser', 'followingUser')
          .where('follow.followerId = :userId', { userId });

        if (startDate) {
          followsQuery.andWhere('follow.createdAt >= :startDate', {
            startDate: new Date(startDate as string),
          });
        }
        if (endDate) {
          followsQuery.andWhere('follow.createdAt <= :endDate', {
            endDate: new Date(endDate as string),
          });
        }

        const follows = await followsQuery
          .orderBy('follow.createdAt', 'DESC')
          .getMany();
        activity.push(
          ...follows.map((follow) => ({
            type: 'follow',
            data: {
              followedUserId: follow.followingUser.id,
              firstName: follow.followingUser.firstName,
              lastName: follow.followingUser.lastName,
            },
            timestamp: follow.createdAt,
          }))
        );
      }

      activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const paginatedActivity = activity.slice(
        Number(offset),
        Number(offset) + Number(limit)
      );

      res.json({
        userId: userId,
        activities: paginatedActivity,
        totalActivities: activity.length,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user activity', error });
    }
  };
}
