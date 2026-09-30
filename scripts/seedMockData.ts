import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import { initMinioBucket, uploadFile, getObjectUrl } from '../infrastructure/minio/minioClient';
import Workout from '../infrastructure/database/models/workoutModel';
import DailyTrainingPlanner from '../infrastructure/database/models/dailyTrainingPlannerModel';
import Meal from '../infrastructure/database/models/mealModel';
import DailyMeals from '../infrastructure/database/models/dailyMealsModel';
import User from '../infrastructure/database/models/userModel';
import UserSettings from '../infrastructure/database/models/userSettingsModel';
import Challenge from '../infrastructure/database/models/challengeModel';
import { flushCache } from '../infrastructure/memcached/memcachedClient';


const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018/fitvibe';

async function seed() {
    console.log('--- Starting FitVibe Mock Data Seeding ---');

    // 1. Connect to MongoDB
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected successfully.');

    // 2. Initialize MinIO S3 bucket & upload sample workout media files
    console.log('Initializing MinIO bucket...');
    await initMinioBucket();

    // Dummy video content for seeding (minimal valid video byte buffer)
    const dummyVideoBuffer = Buffer.from(
        '00000018667479706d703432000000006d70343269736f6d',
        'hex'
    );

    console.log('Uploading sample media to MinIO...');
    const dummyImageBuffer = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000500010d0a2db40000000049454e44ae426082',
        'hex'
    );

    const videoFiles = [
        { name: 'pushups_demo.mp4', title: 'Push Ups Demo', isVideo: true },
        { name: 'squats_demo.mp4', title: 'Bodyweight Squats Demo', isVideo: true },
        { name: 'dumbbell_press_demo.mp4', title: 'Dumbbell Press Demo', isVideo: true },
        { name: 'plank_demo.mp4', title: 'Plank Hold Demo', isVideo: true },
        { name: 'jumping_jacks_demo.mp4', title: 'Jumping Jacks Demo', isVideo: true },
        { name: 'hydration_challenge.png', title: 'Hydration Challenge Image', isVideo: false },
        { name: 'hydration_banner.png', title: 'Hydration Challenge Banner', isVideo: false },
        { name: 'muscle_burn_challenge.png', title: 'Muscle Burn Challenge Image', isVideo: false },
        { name: 'muscle_burn_banner.png', title: 'Muscle Burn Challenge Banner', isVideo: false },
    ];

    const uploadedUrls: Record<string, string> = {};
    for (const file of videoFiles) {
        try {
            const buffer = file.isVideo ? dummyVideoBuffer : dummyImageBuffer;
            const contentType = file.isVideo ? 'video/mp4' : 'image/png';
            const url = await uploadFile(file.name, buffer, contentType);
            uploadedUrls[file.name] = url;
            console.log(`Uploaded ${file.name} -> ${url}`);
        } catch (err) {
            console.warn(`Could not upload ${file.name} to MinIO (is MinIO running?). Using local fallback URL.`);
            uploadedUrls[file.name] = getObjectUrl(file.name);
        }
    }

    // 3. Clear existing collections
    console.log('Clearing existing workouts, daily training planners, meals, and daily meals plans...');
    await Workout.deleteMany({});
    await DailyTrainingPlanner.deleteMany({});
    await Meal.deleteMany({});
    await DailyMeals.deleteMany({});
    await Challenge.deleteMany({});
    await flushCache();


    // 4. Create Mock Workouts (Created by Admin / Free)
    console.log('Seeding mock Workouts...');
    const workouts = await Workout.insertMany([
        {
            name: 'Standard Push-Ups',
            category: 'Chest & Arms',
            difficulty: 'Beginner',
            video: uploadedUrls['pushups_demo.mp4'] || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            description: `## طريقة الأداء الصحيحة
1. استلقِ على الأرض مع وضع اليدين بعرض الكتفين
2. ادفع جسمك للأعلى حتى تستقيم الذراعان
3. انزل ببطء حتى يلامس صدرك الأرض تقريباً

## نصيحة التنفس
شهيق عند النزول — زفير عند الدفع للأعلى

## الأخطاء الشائعة
- ترك الوسط يتدلى للأسفل
- فتح المرفقين بزاوية 90 درجة
- عدم إكمال المدى الحركي الكامل`,
            place: 'Home',
            isFree: true,
        },
        {
            name: 'Bodyweight Squats',
            category: 'Legs & Glutes',
            difficulty: 'Beginner',
            video: uploadedUrls['squats_demo.mp4'] || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            description: `## طريقة الأداء الصحيحة
1. قف مع إبعاد القدمين بعرض الكتفين
2. انزل بحوضك للخلف وللأسفل كأنك تجلس على كرسي
3. حافظ على استقامة الظهر واضغط بكعبيك للعودة للأعلى

## نصيحة التنفس
شهيق أثناء الهبوط — زفير أثناء الصعود

## الأخطاء الشائعة
- انحناء الركبتين للداخل
- رفع الكعبين عن الأرض
- انحناء الظهر للأمام`,
            place: 'Home',
            isFree: true,
        },
        {
            name: 'Dumbbell Bench Press',
            category: 'Chest & Core',
            difficulty: 'Intermediate',
            video: uploadedUrls['dumbbell_press_demo.mp4'] || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
            description: `## طريقة الأداء الصحيحة
1. امسك الأثقال على مستوى الأذنين بوضعية مريحة
2. ارفع الأثقال مستقيماً فوق الصدر
3. انزل ببطء مع التحكم بالحركة

## نصيحة التنفس
زفير عند الرفع ← شهيق عند الإنزال

## الأخطاء الشائعة
- ثني الظهر بشكل مفرط
- رفع الأثقال بسرعة مفرطة
- عدم ثبات الجذع`,
            place: 'Gym',
            isFree: true,
        },
        {
            name: 'Plank Hold',
            category: 'Core & Stability',
            difficulty: 'Beginner',
            video: uploadedUrls['plank_demo.mp4'] || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylikes.mp4',
            description: `## طريقة الأداء الصحيحة
1. ارتكز على الساعدين وأطراف الأصابع
2. حافظ على استقامة الجسم من الرأس إلى الكعبين
3. شد عضلات البطن والأرداف طوال فترة التمرين

## نصيحة التنفس
تنفس بشكل منتظم وهادئ دون حبس النفس

## الأخطاء الشائعة
- هبوط الحوض للأسفل
- رفع الأرداف للأعلى زيادة عن اللزوم
- الانحناء في منطقة الرقبة`,
            place: 'Home',
            isFree: true,
        },
        {
            name: 'Jumping Jacks Cardio',
            category: 'Full Body & Cardio',
            difficulty: 'Beginner',
            video: uploadedUrls['jumping_jacks_demo.mp4'] || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
            description: `## طريقة الأداء الصحيحة
1. قف مستقيماً مع ضم القدمين واليدين بجانب الجسم
2. ادمج القفز مباعداً بين القدمين مع رفع اليدين فوق الرأس
3. عد فوراً لوضعية البداية بشكل متناسق وسريع

## نصيحة التنفس
تنفس بإيقاع متناسق مع الحركة

## الأخطاء الشائعة
- الهبوط الثقيل على الكعبين
- عدم رفع اليدين بالكامل
- سرعة غير متناسقة تؤدي للإجهاد السريع`,
            place: 'Home',
            isFree: true,
        },
    ]);

    console.log(`Created ${workouts.length} workouts.`);

    // 5. Create Mock Daily Training Planners (For Today and Future Days)
    console.log('Seeding Daily Training Planners...');

    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Today's Daily Training Planner (Free System Workout)
    const todayPlanner = await DailyTrainingPlanner.create({
        date: todayMidnight,
        name: 'Full Body Free Starter Workout',
        duration: 40, // 40 minutes total time
        isFree: true,
        isCompleted: false,
        exercises: [
            {
                workoutId: workouts[0]._id, // Push-Ups
                duration: 60,
                repeatition: 15,
                sets: 3,
                kilos: 0,
            },
            {
                workoutId: workouts[1]._id, // Squats
                duration: 60,
                repeatition: 20,
                sets: 4,
                kilos: 0,
            },
            {
                workoutId: workouts[3]._id, // Plank
                duration: 45,
                repeatition: 1,
                sets: 3,
                kilos: 0,
            },
            {
                workoutId: workouts[4]._id, // Jumping Jacks
                duration: 120,
                repeatition: 30,
                sets: 3,
                kilos: 0,
            },
        ],
    });

    console.log(`Created Today's Daily Training Planner: "${todayPlanner.name}" (ID: ${todayPlanner._id})`);

    // Tomorrow's Daily Training Planner
    const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
    await DailyTrainingPlanner.create({
        date: tomorrowMidnight,
        name: 'Upper Body Power & Core (Free)',
        duration: 45,
        isFree: true,
        isCompleted: false,
        exercises: [
            {
                workoutId: workouts[0]._id,
                duration: 60,
                repeatition: 20,
                sets: 4,
                kilos: 0,
            },
            {
                workoutId: workouts[2]._id,
                duration: 90,
                repeatition: 12,
                sets: 4,
                kilos: 15,
            },
            {
                workoutId: workouts[3]._id,
                duration: 60,
                repeatition: 1,
                sets: 4,
                kilos: 0,
            },
        ],
    });

    // 6. Create Mock Meals & Daily Meals Plans
    console.log('Seeding mock Meals...');
    const meals = await Meal.insertMany([
        {
            name: 'شوفان وبروتين شيك (Oatmeal & Protein Shake)',
            carbs: 55,
            protein: 35,
            fats: 10,
            calories: 450,
            ingredients: ['Rolled Oats 80g', 'Whey Protein 30g', 'Almond Milk 250ml', 'Banana 1'],
            isFree: true,
        },
        {
            name: 'دجاج مشوي وكينوا (Grilled Chicken & Quinoa)',
            carbs: 65,
            protein: 55,
            fats: 18,
            calories: 650,
            ingredients: ['Chicken Breast 200g', 'Quinoa 150g', 'Steamed Vegetables', 'Olive Oil 10ml'],
            isFree: true,
        },
        {
            name: 'سلمون وأسباراغوس (Salmon & Asparagus)',
            carbs: 25,
            protein: 45,
            fats: 25,
            calories: 550,
            ingredients: ['Fresh Salmon Fillet 200g', 'Grilled Asparagus 150g', 'Lemon Juice', 'Garlic Butter'],
            isFree: true,
        },
        {
            name: 'زبادي يوناني وثمار (Greek Yogurt & Berries)',
            carbs: 20,
            protein: 15,
            fats: 4,
            calories: 200,
            ingredients: ['Greek Yogurt 150g', 'Fresh Blueberries 50g', 'Raw Honey 10g'],
            isFree: true,
        },
    ]);

    console.log(`Created ${meals.length} mock meals.`);

    // Today's Daily Meals Plan matching UI screenshot
    const todayDailyMeals = await DailyMeals.create({
        date: todayMidnight,
        is_complete: false,
        isFree: true,
        meals: [
            {
                meal_type: 'Breakfast',
                mealId: meals[0]._id, // Oats & Protein Shake
                status: 'completed', // تم التسجيل
                logged_at: new Date(),
            },
            {
                meal_type: 'Lunch',
                mealId: meals[1]._id, // Grilled Chicken & Quinoa
                status: 'pending', // سجّل الوجبة
            },
            {
                meal_type: 'Dinner',
                mealId: meals[2]._id, // Salmon & Asparagus
                status: 'upcoming', // قادم
            },
            {
                meal_type: 'Snacks',
                mealId: meals[3]._id, // Greek Yogurt & Berries
                status: 'upcoming', // قادم
            },
        ],
    });

    console.log(`Created Today's Daily Meals Plan (ID: ${todayDailyMeals._id})`);

    // Tomorrow's Daily Meals Plan
    await DailyMeals.create({
        date: tomorrowMidnight,
        is_complete: false,
        isFree: true,
        meals: [
            {
                meal_type: 'Breakfast',
                mealId: meals[0]._id,
                status: 'pending',
            },
            {
                meal_type: 'Lunch',
                mealId: meals[1]._id,
                status: 'pending',
            },
            {
                meal_type: 'Dinner',
                mealId: meals[2]._id,
                status: 'pending',
            },
        ],
    });

    // 7. Ensure test user exists
    const testUsername = 'testuser';
    let user = await User.findOne({ username: testUsername });

    if (!user) {
        console.log(`Creating test user "${testUsername}"...`);
        const hashedPassword = await bcrypt.hash('password123', 10);
        user = await User.create({
            username: testUsername,
            email: 'testuser@fitvibe.com',
            password: hashedPassword,
            account_type: 'client',
            first_name: 'Alex',
            last_name: 'Fitness',
            age: 25,
            gender: 'Male',
            client: {
                weight: 75,
                height: 180,
                fats: '15%',
                personal_goals: {
                    goal: 'Increase physical fitness',
                    weight_goal: 72,
                },
            },
        });
        console.log(`Created test user with ID: ${user._id}`);
    } else {
        console.log(`Test user "${testUsername}" already exists.`);
    }

    // Ensure UserSettings exist for test user
    let settings = await UserSettings.findOne({ userId: user._id });
    if (!settings) {
        await UserSettings.create({
            userId: user._id,
            water: {
                is_active: true,
                daily_need: 2.5,
                cup_size_ml: 250,
                reminder_interval_minutes: 60,
            },
        });
        console.log(`Created UserSettings for test user.`);
    }

    // 8. Seed Mock Challenges (Free Hydration & Premium Muscle Burn)
    console.log('Seeding mock Community Challenges...');
    await Challenge.create([
        {
            createdBy: user._id,
            title: 'تحدي الترطيب 7 أيام',
            description: 'تحدي يومي للوصول لشرب 2.5 لتر ماء يومياً لبناء عادة صحية مستدامة.',
            image: uploadedUrls['hydration_challenge.png'] || 'https://via.placeholder.com/300x200?text=Hydration+Challenge',
            bannerImage: uploadedUrls['hydration_banner.png'] || 'https://via.placeholder.com/800x400?text=Hydration+Banner',
            accessType: 'free',
            categories: ['hydration'],
            durationDays: 7,
            period: {
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            isPublished: true,
            challengeType: 'type1_system_daily_tasks',
            dailyTasks: [],
            participantsCount: 248,
        },
        {
            createdBy: user._id,
            title: 'تحدي حرق العضلات الاحترافي',
            description: 'تحدي احترافي لمدة 30 يوم لبناء وتضخيم العضلات وحرق الدهون مع متابعة المدرب.',
            image: uploadedUrls['muscle_burn_challenge.png'] || 'https://via.placeholder.com/300x200?text=Muscle+Burn+Challenge',
            bannerImage: uploadedUrls['muscle_burn_banner.png'] || 'https://via.placeholder.com/800x400?text=Muscle+Burn+Banner',
            accessType: 'premium',
            categories: ['workout'],
            durationDays: 30,
            period: {
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            isPublished: true,
            challengeType: 'type2_coach_custom_tasks',
            dailyTasks: [],
            participantsCount: 512,
        },
    ]);
    console.log('Seeded mock Challenges successfully.');

    console.log('\n--- Mock Data Seeding Completed Successfully! ---');
    await mongoose.connection.close();
    process.exit(0);
}

seed().catch((err) => {
    console.error('Error during mock data seeding:', err);
    process.exit(1);
});
