import {Router} from 'express';
import {validate} from '../middleware/validation.middleware';
import {createPostSchema,updatePostSchema} from '../validations/post.validation';
import {PostController} from '../controllers/post.controller';

export const postRouter = Router();
const postController = new PostController();

postRouter.get('/feed',postController.getFeed.bind(postController));

postRouter.get('/hashtag/:tag',postController.getPostsByHashtag.bind(postController));

postRouter.get('/',postController.getAllPosts.bind(postController));

postRouter.post('/',validate(createPostSchema),postController.createPost.bind(postController));

postRouter.put('/:id',validate(updatePostSchema),postController.updatePost.bind(postController));

postRouter.get('/:id', postController.getPostById.bind(postController));

postRouter.delete('/:id',postController.deletePost.bind(postController));

