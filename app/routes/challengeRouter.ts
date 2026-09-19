import { Router } from 'express';
import { challengeController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

// Challenge Management & Discovery
router.get('/', isAuthenticated, challengeController.getPublishedChallenges);
router.get('/:id', isAuthenticated, challengeController.getChallengeDetails);
router.post('/:id/join', isAuthenticated, challengeController.joinChallenge);
router.get('/:id/leaderboard', isAuthenticated, challengeController.getChallengeLeaderboard);

// Challenge Community Feed & Interactions
router.get('/:id/posts', isAuthenticated, challengeController.getCommunityPosts);
router.post('/:id/posts', isAuthenticated, challengeController.createCommunityPost);
router.get('/posts/:postId/comments', isAuthenticated, challengeController.getPostComments);
router.post('/posts/:postId/comments', isAuthenticated, challengeController.addPostComment);
router.post('/posts/:postId/react', isAuthenticated, challengeController.togglePostReaction);

export default router;
