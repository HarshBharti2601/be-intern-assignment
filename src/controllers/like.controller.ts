import { Request, Response } from 'express';
import { Like } from '../entities/Like';
import { Post } from '../entities/Post';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';

export class LikeController {
  private likeRepository = AppDataSource.getRepository(Like);
  private postRepository = AppDataSource.getRepository(Post);
  private userRepository = AppDataSource.getRepository(User);

  async getAllLikes(req: Request, res: Response) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const [likes, total] = await this.likeRepository.findAndCount({
        relations: ['user', 'post'],
        take: Number(limit),
        skip: Number(offset),
        order: { createdAt: 'DESC' },
      });

      res.json({
        data: likes,
        pagination: { total, limit: Number(limit), offset: Number(offset) },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching likes', error });
    }
  }

  async getLikeById(req: Request, res: Response) {
    try {
      const likeId = parseInt(req.params.id);

      const like = await this.likeRepository.findOne({
        where: { id: likeId },
        relations: ['user', 'post'],
      });

      if (!like) {
        return res.status(404).json({ message: 'Like not found' });
      }

      res.json(like);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching like', error });
    }
  }

  async createLike(req: Request, res: Response) {
    try {
      const { userId, postId } = req.body;

      const post = await this.postRepository.findOneBy({ id: postId });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingLike = await this.likeRepository.findOneBy({
        userId,
        postId,
      });

      if (existingLike) {
        return res.status(400).json({
          message: 'User has already liked this post',
        });
      }

      const like = this.likeRepository.create({ userId, postId });
      const result = await this.likeRepository.save(like);

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating like', error });
    }
  }

  async deleteLike(req: Request, res: Response) {
    try {
      const likeId = parseInt(req.params.id);

      const like = await this.likeRepository.findOneBy({ id: likeId });

      if (!like) {
        return res.status(404).json({ message: 'Like not found' });
      }

      await this.likeRepository.remove(like);

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting like', error });
    }
  }
}