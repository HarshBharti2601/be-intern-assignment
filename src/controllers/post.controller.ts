import { Request, Response } from 'express';
import { Post } from '../entities/Post';
import { Hashtag } from '../entities/Hashtag';
import { Follow } from '../entities/Follow';
import { AppDataSource } from '../data-source';

export class PostController{
    private postRepository = AppDataSource.getRepository(Post);
    private hashtagRepository = AppDataSource.getRepository(Hashtag);
    private followRepository = AppDataSource.getRepository(Follow);


async getAllPosts(req: Request, res: Response){
  try {
    const { limit = 10, offset = 0 } = req.query;

    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['author', 'likes', 'hashtags'],
      take: Number(limit),
      skip: Number(offset),
      order: { createdAt: 'DESC' },
    });

    const postsWithLikeCount = posts.map((post) => ({
      ...post,
      likeCount: post.likes.length,
    }));

    res.json({
      data: postsWithLikeCount,
      pagination: { total, limit: Number(limit), offset: Number(offset) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error });
  }
};

async getPostById(req: Request, res: Response){
  try {
    const { id } = req.params;

    const post = await this.postRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['author', 'likes', 'hashtags'],
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const response = { ...post, likeCount: post.likes.length };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post', error });
  }
};

async createPost(req: Request, res: Response){
  try {
    const { content, authorId, hashtags } = req.body;

    const post = this.postRepository.create({ content, authorId });

    if (hashtags && hashtags.length > 0) {
      const hashtagEntities = [];
      for (const tag of hashtags) {
        let hashtag = await this.hashtagRepository.findOne({
          where: { tag: tag.toLowerCase() },
        });

        if (!hashtag) {
          hashtag = this.hashtagRepository.create({ tag: tag.toLowerCase() });
          await this.hashtagRepository.save(hashtag);
        }

        hashtagEntities.push(hashtag);
      }
      post.hashtags = hashtagEntities;
    }

    await this.postRepository.save(post);

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error });
  }
};

async updatePost(req: Request, res: Response){
  try {
    const { id } = req.params;
    const { content, hashtags } = req.body;

    const post = await this.postRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['hashtags'],
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (content) post.content = content;

    if (hashtags && hashtags.length > 0) {
      const hashtagEntities = [];
      for (const tag of hashtags) {
        let hashtag = await this.hashtagRepository.findOne({
          where: { tag: tag.toLowerCase() },
        });

        if (!hashtag) {
          hashtag = this.hashtagRepository.create({ tag: tag.toLowerCase() });
          await this.hashtagRepository.save(hashtag);
        }

        hashtagEntities.push(hashtag);
      }
      post.hashtags = hashtagEntities;
    }

    await this.postRepository.save(post);

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error updating post', error });
  }
};

async deletePost(req: Request, res: Response){
  try {
    const { id } = req.params;

    const post = await this.postRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await this.postRepository.remove(post);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error });
  }
};

async getFeed(req: Request, res: Response){
  try {
    const { userId, limit = 10, offset = 0 } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ message: 'userId query parameter is required' });
    }

    const followingUsers = await this.followRepository.find({
      where: { followerId: userId as string },
      select: ['followingId'],
    });

    const followingIds = followingUsers.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return res.json({
        data: [],
        pagination: { limit: Number(limit), offset: Number(offset), total: 0 },
      });
    }

    const [posts, total] = await this.postRepository.findAndCount({
      where: { authorId: followingIds as any },
      relations: ['author', 'likes', 'hashtags'],
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: Number(offset),
    });

    const feedWithLikeCount = posts.map((post) => ({
      ...post,
      likeCount: post.likes.length,
    }));

    res.json({
      data: feedWithLikeCount,
      pagination: { total, limit: Number(limit), offset: Number(offset) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feed', error });
  }
};

async getPostsByHashtag(req: Request, res: Response){
  try {
    const { tag } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!tag) {
      return res.status(400).json({ message: 'Tag parameter is required' });
    }

    const hashtag = await this.hashtagRepository.findOne({
      where: { tag: tag.toLowerCase() },
      relations: ['posts'],
    });

    if (!hashtag) {
      return res.json({
        data: [],
        message: 'No posts found with this hashtag',
        pagination: { limit: Number(limit), offset: Number(offset), total: 0 },
      });
    }

    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['hashtags', 'author', 'likes'],
      where: { hashtags: { id: hashtag.id } },
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: Number(offset),
    });

    const postsWithLikeCount = posts.map((post) => ({
      ...post,
      likeCount: post.likes.length,
    }));

    res.json({
      data: postsWithLikeCount,
      pagination: { total, limit: Number(limit), offset: Number(offset) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts by hashtag', error });
  }
};
}