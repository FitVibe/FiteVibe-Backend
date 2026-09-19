import { Request, Response } from 'express';
import ChallengeService from '../services/ChallengeService';
import ChallengeCommunityService from '../services/ChallengeCommunityService';

export default class ChallengeController {
    private challengeService: ChallengeService;
    private communityService: ChallengeCommunityService;

    constructor(
        challengeService: ChallengeService,
        communityService: ChallengeCommunityService
    ) {
        this.challengeService = challengeService;
        this.communityService = communityService;
    }

    public getPublishedChallenges = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const skip = parseInt(req.query.skip as string || '0', 10);
            const limit = parseInt(req.query.limit as string || '20', 10);

            const challenges = await this.challengeService.getPublishedChallenges(user._id.toString(), skip, limit);
            res.status(200).json({ status: 'success', data: challenges });
        } catch (error: any) {
            console.error('Error fetching published challenges:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };

    public getChallengeDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { id } = req.params;
            const details = await this.challengeService.getChallengeDetails(id, user._id.toString());
            res.status(200).json({ status: 'success', data: details });
        } catch (error: any) {
            console.error('Error fetching challenge details:', error);
            res.status(404).json({ message: error.message || 'Challenge not found' });
        }
    };

    public joinChallenge = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { id } = req.params;
            const enrollment = await this.challengeService.joinChallenge(user._id.toString(), id);
            res.status(200).json({ status: 'success', data: enrollment });
        } catch (error: any) {
            console.error('Error joining challenge:', error);
            res.status(400).json({ message: error.message || 'Could not join challenge' });
        }
    };

    public getChallengeLeaderboard = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const leaderboard = await this.challengeService.getChallengeLeaderboard(id);
            res.status(200).json({ status: 'success', data: leaderboard });
        } catch (error: any) {
            console.error('Error fetching challenge leaderboard:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };

    public createCommunityPost = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { id } = req.params; // challengeId
            const { content, image } = req.body;

            if (!content) {
                res.status(400).json({ message: 'Post content is required' });
                return;
            }

            const post = await this.communityService.createPost(user._id.toString(), id, content, image);
            res.status(201).json({ status: 'success', data: post });
        } catch (error: any) {
            console.error('Error creating post:', error);
            res.status(400).json({ message: error.message || 'Error creating post' });
        }
    };

    public getCommunityPosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { id } = req.params; // challengeId
            const skip = parseInt(req.query.skip as string || '0', 10);
            const limit = parseInt(req.query.limit as string || '20', 10);

            const posts = await this.communityService.getChallengePosts(id, user._id.toString(), skip, limit);
            res.status(200).json({ status: 'success', data: posts });
        } catch (error: any) {
            console.error('Error fetching community posts:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };

    public addPostComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { postId } = req.params;
            const { content } = req.body;

            if (!content) {
                res.status(400).json({ message: 'Comment content is required' });
                return;
            }

            const comment = await this.communityService.addComment(user._id.toString(), postId, content);
            res.status(201).json({ status: 'success', data: comment });
        } catch (error: any) {
            console.error('Error adding comment:', error);
            res.status(400).json({ message: error.message || 'Error adding comment' });
        }
    };

    public getPostComments = async (req: Request, res: Response): Promise<void> => {
        try {
            const { postId } = req.params;
            const comments = await this.communityService.getPostComments(postId);
            res.status(200).json({ status: 'success', data: comments });
        } catch (error: any) {
            console.error('Error fetching post comments:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };

    public togglePostReaction = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { postId } = req.params;
            const { reactionType } = req.body;

            const result = await this.communityService.toggleReaction(user._id.toString(), postId, reactionType || 'like');
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            console.error('Error toggling reaction:', error);
            res.status(400).json({ message: error.message || 'Error toggling reaction' });
        }
    };
}
