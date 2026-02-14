import { Request, Response } from 'express';
import { Follow } from '../entities/Follow';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';

export class FollowController {
  private followRepository = AppDataSource.getRepository(Follow);
  private userRepository = AppDataSource.getRepository(User);

  async getAllFollows(req: Request, res: Response) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const [follows, total] = await this.followRepository.findAndCount({
        relations: ['follower', 'followingUser'],
        take: Number(limit),
        skip: Number(offset),
        order: { createdAt: 'DESC' },
      });

      res.json({
        data: follows,
        pagination: { total, limit: Number(limit), offset: Number(offset) },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching follows', error });
    }
  }

  async getFollowById(req: Request, res: Response) {
    try {
      const followId = parseInt(req.params.id);

      const follow = await this.followRepository.findOne({
        where: { id: followId.toString() },
        relations: ['follower', 'followingUser'],
      });

      if (!follow) {
        return res.status(404).json({ message: 'Follow not found' });
      }

      res.json(follow);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching follow', error });
    }
  }

  async createFollow(req: Request, res: Response) {
    try {
      const { followerId, followingId } = req.body;

      if (followerId === followingId) {
        return res.status(400).json({
          message: 'Cannot follow yourself',
        });
      }

      const follower = await this.userRepository.findOneBy({ id: followerId });
      if (!follower) {
        return res.status(404).json({ message: 'Follower user not found' });
      }

      const following = await this.userRepository.findOneBy({
        id: followingId,
      });
      if (!following) {
        return res.status(404).json({ message: 'User to follow not found' });
      }

      const existingFollow = await this.followRepository.findOneBy({
        followerId,
        followingId,
      });

      if (existingFollow) {
        return res.status(400).json({
          message: 'Already following this user',
        });
      }

      const follow = this.followRepository.create({ followerId, followingId });
      const result = await this.followRepository.save(follow);

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating follow', error });
    }
  }

  async deleteFollow(req: Request, res: Response) {
    try {
      const followId = parseInt(req.params.id);

      const follow = await this.followRepository.findOneBy({ id: followId.toString()});

      if (!follow) {
        return res.status(404).json({ message: 'Follow not found' });
      }

      await this.followRepository.remove(follow);

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting follow', error });
    }
  }
}