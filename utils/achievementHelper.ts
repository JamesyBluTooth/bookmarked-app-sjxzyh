
import { supabase } from '@/lib/supabase';

export interface UserProgress {
  booksRead: number;
  currentStreak: number;
  totalPagesRead: number;
  totalTimeSpentMinutes: number;
  ratingsGiven: number;
}

export async function checkAndAwardAchievements(userId: string, progress: UserProgress) {
  try {
    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');

    if (achievementsError) throw achievementsError;

    // Get user's completed achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (userAchievementsError) throw userAchievementsError;

    const completedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    // Check each achievement
    const newAchievements = [];
    for (const achievement of achievements || []) {
      // Skip if already completed
      if (completedIds.has(achievement.id)) continue;

      let isCompleted = false;

      switch (achievement.requirement_type) {
        case 'books_read':
          isCompleted = progress.booksRead >= achievement.requirement_value;
          break;
        case 'reading_streak':
          isCompleted = progress.currentStreak >= achievement.requirement_value;
          break;
        case 'pages_read':
          isCompleted = progress.totalPagesRead >= achievement.requirement_value;
          break;
        case 'time_spent':
          isCompleted = progress.totalTimeSpentMinutes >= achievement.requirement_value;
          break;
        case 'ratings_given':
          isCompleted = progress.ratingsGiven >= achievement.requirement_value;
          break;
      }

      if (isCompleted) {
        newAchievements.push({
          user_id: userId,
          achievement_id: achievement.id,
        });
      }
    }

    // Award new achievements
    if (newAchievements.length > 0) {
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert(newAchievements);

      if (insertError) throw insertError;

      console.log(`Awarded ${newAchievements.length} new achievements to user ${userId}`);
    }

    return newAchievements.length;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return 0;
  }
}

export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    // Get books read count from user stats or snapshot
    const { data: snapshot } = await supabase
      .from('user_snapshots')
      .select('snapshot')
      .eq('user_id', userId)
      .single();

    const booksRead = snapshot?.snapshot?.data?.userStats?.booksRead || 0;
    const currentStreak = snapshot?.snapshot?.data?.userStats?.currentStreak || 0;

    // Get total pages read
    const { data: sessions } = await supabase
      .from('reading_sessions')
      .select('pages_read, time_spent_minutes')
      .eq('user_id', userId);

    const totalPagesRead = sessions?.reduce((sum, s) => sum + (s.pages_read || 0), 0) || 0;
    const totalTimeSpentMinutes = sessions?.reduce((sum, s) => sum + (s.time_spent_minutes || 0), 0) || 0;

    // Get ratings count
    const { data: ratings } = await supabase
      .from('book_ratings')
      .select('id')
      .eq('user_id', userId);

    const ratingsGiven = ratings?.length || 0;

    return {
      booksRead,
      currentStreak,
      totalPagesRead,
      totalTimeSpentMinutes,
      ratingsGiven,
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    return {
      booksRead: 0,
      currentStreak: 0,
      totalPagesRead: 0,
      totalTimeSpentMinutes: 0,
      ratingsGiven: 0,
    };
  }
}
