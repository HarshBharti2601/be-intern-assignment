import { Request, Response } from 'express';
import { Hashtag } from '../entities/Hashtag';
import { AppDataSource } from '../data-source';

export class HashtagController {
  private hashtagRepository = AppDataSource.getRepository(Hashtag);

  async getAllHashtags(req: Request, res: Response) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const [hashtags, total] = await this.hashtagRepository.findAndCount({
        relations: ['posts'],
        take: Number(limit),
        skip: Number(offset),
        order: { createdAt: 'DESC' },
      });

      const hashtagsWithCount = hashtags.map((hashtag) => ({
        ...hashtag,
        postCount: hashtag.posts.length,
      }));

      res.json({
        data: hashtagsWithCount,
        pagination: { total, limit: Number(limit), offset: Number(offset) },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching hashtags', error });
    }
  }

  async getHashtagById(req: Request, res: Response) {
    try {
      const hashtagId = parseInt(req.params.id);

      const hashtag = await this.hashtagRepository.findOne({
        where: { id: hashtagId },
        relations: ['posts'],
      });

      if (!hashtag) {
        return res.status(404).json({ message: 'Hashtag not found' });
      }

      const response = {
        ...hashtag,
        postCount: hashtag.posts.length,
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching hashtag', error });
    }
  }

  async createHashtag(req: Request, res: Response) {
    try {
      const { tag } = req.body;

      const normalizedTag = tag.toLowerCase();

      const existingHashtag = await this.hashtagRepository.findOneBy({
        tag: normalizedTag,
      });

      if (existingHashtag) {
        return res.status(400).json({
          message: 'Hashtag already exists',
        });
      }

      const hashtag = this.hashtagRepository.create({
        tag: normalizedTag,
      });

      const result = await this.hashtagRepository.save(hashtag);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating hashtag', error });
    }
  }

  async updateHashtag(req: Request, res: Response) {
    try {
      const hashtagId = parseInt(req.params.id);
      const { tag } = req.body;

      const hashtag = await this.hashtagRepository.findOneBy({ id: hashtagId });

      if (!hashtag) {
        return res.status(404).json({ message: 'Hashtag not found' });
      }

      const normalizedTag = tag.toLowerCase();

      const existingHashtag = await this.hashtagRepository.findOneBy({
        tag: normalizedTag,
      });

      if (existingHashtag && existingHashtag.id !== hashtagId) {
        return res.status(400).json({
          message: 'Another hashtag with this tag already exists',
        });
      }

      hashtag.tag = normalizedTag;
      const result = await this.hashtagRepository.save(hashtag);

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error updating hashtag', error });
    }
  }

  async deleteHashtag(req: Request, res: Response) {
    try {
      const hashtagId = parseInt(req.params.id);

      const hashtag = await this.hashtagRepository.findOneBy({ id: hashtagId });

      if (!hashtag) {
        return res.status(404).json({ message: 'Hashtag not found' });
      }

      await this.hashtagRepository.remove(hashtag);

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting hashtag', error });
    }
  }
}