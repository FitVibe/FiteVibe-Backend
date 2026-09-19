import { IChallengeRepository } from "@/domain/repositories/IChallengeRepository";
import { IUserChallengeRepository } from "@/domain/repositories/IUserChallengeRepository";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { ChallengePointService } from "@/domain/services/ChallengePointService";
import { getCache, setCache, delCache } from "@/infrastructure/memcached/memcachedClient";

export default class ChallengeService {
    private challengeRepo: IChallengeRepository;
    private userChallengeRepo: IUserChallengeRepository;
    private userRepo: IUserRepository;

    constructor(
        challengeRepo: IChallengeRepository,
        userChallengeRepo: IUserChallengeRepository,
        userRepo: IUserRepository
    ) {
        this.challengeRepo = challengeRepo;
        this.userChallengeRepo = userChallengeRepo;
        this.userRepo = userRepo;
    }

    /**
     * Lists all published challenges with user-specific enrollment and lock status.
     */
    public async getPublishedChallenges(userId: string, skip: number = 0, limit: number = 20) {
        const user = await this.userRepo.findById(userId);
        const isPremiumUser = (user as any)?.account_type === 'premium' || (user as any)?.client?.account_type === 'premium';

        const challenges = (await this.challengeRepo.findPublishedChallenges(undefined, skip, limit)) || [];
        const total = typeof this.challengeRepo.countPublishedChallenges === 'function'
            ? (await this.challengeRepo.countPublishedChallenges())
            : challenges.length;

        const userChallenges = (await this.userChallengeRepo.findActiveUserChallenges(userId)) || [];
        const enrolledMap = new Map<string, any>();
        userChallenges.forEach(uc => enrolledMap.set(uc.challengeId.toString(), uc));

        const challengesFormatted = challenges.map(ch => {
            const chId = ch._id ? ch._id.toString() : '';
            const isEnrolled = chId ? enrolledMap.has(chId) : false;
            const userProgress = chId ? enrolledMap.get(chId) : null;
            const isLocked = ch.accessType === 'premium' && !isPremiumUser;

            return {
                _id: ch._id,
                title: ch.title,
                description: ch.description,
                image: ch.image,
                bannerImage: ch.bannerImage,
                accessType: ch.accessType,
                categories: ch.categories,
                durationDays: ch.durationDays,
                period: ch.period,
                challengeType: ch.challengeType,
                participantsCount: ch.participantsCount,
                createdBy: ch.createdBy,
                isLocked,
                isEnrolled,
                userProgress: userProgress ? {
                    earnedPoints: userProgress.earnedPoints,
                    completedDaysCount: userProgress.completedDays?.length || 0,
                    status: userProgress.status,
                } : null,
            };
        });

        return {
            challenges: challengesFormatted,
            total,
            skip,
            limit,
            hasMore: skip + challengesFormatted.length < total
        };
    }

    /**
     * Retrieves detailed challenge view including daily tasks.
     */
    public async getChallengeDetails(challengeId: string, userId: string) {
        const challenge = await this.challengeRepo.findById(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const user = await this.userRepo.findById(userId);
        const isPremiumUser = (user as any)?.account_type === 'premium' || (user as any)?.client?.account_type === 'premium';
        const isLocked = challenge.accessType === 'premium' && !isPremiumUser;

        const enrollment = await this.userChallengeRepo.findByUserAndChallenge(userId, challengeId);

        return {
            challenge,
            isLocked,
            enrollment: enrollment || null,
        };
    }

    /**
     * Enrolls a user in a challenge.
     */
    public async joinChallenge(userId: string, challengeId: string) {
        const challenge = await this.challengeRepo.findById(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        if (!challenge.isPublished) {
            throw new Error('Cannot join unpublished challenge');
        }

        const user = await this.userRepo.findById(userId);
        const isPremiumUser = (user as any)?.account_type === 'premium' || (user as any)?.client?.account_type === 'premium';

        if (challenge.accessType === 'premium' && !isPremiumUser) {
            throw new Error('Upgrade to Premium to access this challenge');
        }

        const existing = await this.userChallengeRepo.findByUserAndChallenge(userId, challengeId);
        if (existing) {
            return existing;
        }

        const enrollment = await this.userChallengeRepo.create({
            userId: userId as any,
            challengeId: challengeId as any,
            joinedAt: new Date(),
            completedDays: [],
            earnedPoints: 0,
            status: 'in_progress',
        });

        await this.challengeRepo.incrementParticipantCount(challengeId);
        await delCache(`challenge:leaderboard:${challengeId}`);
        return enrollment;
    }

    /**
     * Retrieves the single-challenge leaderboard ("Classement").
     */
    public async getChallengeLeaderboard(challengeId: string) {
        const cacheKey = `challenge:leaderboard:${challengeId}`;
        let leaderboard = await getCache<any[]>(cacheKey);

        if (!leaderboard) {
            const rawLeaderboard = await this.userChallengeRepo.getChallengeLeaderboard(challengeId, 50);
            leaderboard = rawLeaderboard.map((item, index) => ({
                rank: index + 1,
                userId: (item.userId as any)?._id || item.userId,
                username: (item.userId as any)?.username || 'User',
                fullName: `${(item.userId as any)?.first_name || ''} ${(item.userId as any)?.last_name || ''}`.trim() || 'Anonymous User',
                profileImage: (item.userId as any)?.profile_image || '',
                earnedPoints: item.earnedPoints,
                completedDaysCount: item.completedDays?.length || 0,
            }));
            await setCache(cacheKey, leaderboard, 60); // 1 minute TTL for live ranking
        }

        return leaderboard;
    }
}
