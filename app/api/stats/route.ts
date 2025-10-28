import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Helper function to get specific user stats
async function getUserStats(regNo: string) {
  logger.info('Fetching user-specific statistics', { regNo });

  // Get user info
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('reg_no', regNo)
    .single();

  if (userError || !user) {
    throw new NotFoundError(`User with registration number ${regNo} not found`);
  }

  // Get user's practice entries
  const { data: userEntries, error: entriesError } = await supabase
    .from('practice_entries')
    .select('minutes, date, practice_text, sankalp_word, created_at')
    .eq('reg_no', regNo)
    .order('date', { ascending: false });

  if (entriesError) {
    throw new Error(`Failed to fetch user entries: ${entriesError.message}`);
  }

  const totalMinutes = userEntries?.reduce((sum, entry) => sum + entry.minutes, 0) || 0;
  const totalHours = totalMinutes / 60;
  const entryCount = userEntries?.length || 0;
  const averageMinutesPerEntry = entryCount > 0 ? totalMinutes / entryCount : 0;

  // Get user's recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentEntries = userEntries?.filter(
    (entry) => new Date(entry.created_at) >= sevenDaysAgo
  ) || [];

  const recentMinutes = recentEntries.reduce((sum, entry) => sum + entry.minutes, 0);
  const recentHours = recentMinutes / 60;

  // Get all users' total minutes to calculate rank
  const { data: allUserStats, error: allStatsError } = await supabase
    .from('practice_entries')
    .select('reg_no, minutes');

  if (allStatsError) {
    throw new Error(`Failed to fetch all user stats: ${allStatsError.message}`);
  }

  // Aggregate by user to calculate rank
  const userTotalsMap = new Map<string, number>();
  allUserStats?.forEach((entry) => {
    const existing = userTotalsMap.get(entry.reg_no) || 0;
    userTotalsMap.set(entry.reg_no, existing + entry.minutes);
  });

  const sortedUsers = Array.from(userTotalsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([regNo]) => regNo);

  const rank = sortedUsers.indexOf(regNo) + 1;
  const totalActiveUsers = sortedUsers.length;

  // Get target from settings
  const { data: targetSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'target_practice_minutes')
    .single();

  const targetMinutes = parseInt(targetSetting?.value || '3060000', 10);
  const targetHours = targetMinutes / 60;

  // Get community total for percentage calculation
  const communityTotal = Array.from(userTotalsMap.values()).reduce((sum, val) => sum + val, 0);
  const userContributionPercentage = communityTotal > 0 ? (totalMinutes / communityTotal) * 100 : 0;

  logger.info('User statistics fetched successfully', {
    regNo,
    totalHours,
    rank,
  });

  return NextResponse.json({
    user: {
      regNo: user.reg_no,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      batch: user.batch,
    },
    practice: {
      totalMinutes,
      totalHours: parseFloat(totalHours.toFixed(2)),
      entryCount,
      averageMinutesPerEntry: parseFloat(averageMinutesPerEntry.toFixed(2)),
      averageHoursPerEntry: parseFloat((averageMinutesPerEntry / 60).toFixed(2)),
    },
    ranking: {
      rank,
      totalActiveUsers,
      percentile: parseFloat(((1 - (rank - 1) / totalActiveUsers) * 100).toFixed(2)),
    },
    contribution: {
      percentage: parseFloat(userContributionPercentage.toFixed(2)),
      communityTotal: {
        minutes: communityTotal,
        hours: parseFloat((communityTotal / 60).toFixed(2)),
      },
      target: {
        minutes: targetMinutes,
        hours: targetHours,
      },
    },
    recentActivity: {
      last7Days: {
        minutes: recentMinutes,
        hours: parseFloat(recentHours.toFixed(2)),
        entries: recentEntries.length,
      },
    },
    recentEntries: recentEntries.slice(0, 10).map((entry) => ({
      date: entry.date,
      minutes: entry.minutes,
      hours: parseFloat((entry.minutes / 60).toFixed(2)),
      practiceText: entry.practice_text,
      sankalpWord: entry.sankalp_word,
    })),
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  try {
    // Check if specific user stats requested
    const { searchParams } = new URL(request.url);
    const regNo = searchParams.get('regNo');

    if (regNo) {
      // Return specific user stats
      return getUserStats(regNo);
    }

    // Return community-wide stats
    logger.info('Fetching practice statistics');

    // Get target practice minutes from settings
    const { data: targetSetting, error: settingError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'target_practice_minutes')
      .single();

    if (settingError) {
      logger.error('Error fetching target setting', {
        error: settingError.message,
      });
      // Default to 51,000 hours if setting not found
    }

    const targetMinutes = parseInt(targetSetting?.value || '3060000', 10);
    const targetHours = targetMinutes / 60;

    // Get total practice minutes across all users
    const { data: totalData, error: totalError } = await supabase
      .from('practice_entries')
      .select('minutes');

    if (totalError) {
      throw new Error(`Failed to fetch total minutes: ${totalError.message}`);
    }

    const totalMinutes = totalData?.reduce((sum, entry) => sum + entry.minutes, 0) || 0;
    const totalHours = totalMinutes / 60;

    // Get per-user statistics
    const { data: userStats, error: userStatsError } = await supabase
      .from('practice_entries')
      .select('reg_no, minutes, user_id');

    if (userStatsError) {
      throw new Error(`Failed to fetch user stats: ${userStatsError.message}`);
    }

    // Aggregate by user
    const userStatsMap = new Map<string, { regNo: string; userId: string; totalMinutes: number; totalHours: number; entryCount: number }>();

    userStats?.forEach((entry) => {
      const existing = userStatsMap.get(entry.reg_no);
      if (existing) {
        existing.totalMinutes += entry.minutes;
        existing.totalHours = existing.totalMinutes / 60;
        existing.entryCount += 1;
      } else {
        userStatsMap.set(entry.reg_no, {
          regNo: entry.reg_no,
          userId: entry.user_id,
          totalMinutes: entry.minutes,
          totalHours: entry.minutes / 60,
          entryCount: 1,
        });
      }
    });

    const userStatistics = Array.from(userStatsMap.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    );

    // Get total number of users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      throw new Error(`Failed to count users: ${usersError.message}`);
    }

    // Get active users (users with at least one entry)
    const activeUsers = userStatsMap.size;

    // Calculate progress percentage
    const progressPercentage = (totalMinutes / targetMinutes) * 100;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentEntries, error: recentError } = await supabase
      .from('practice_entries')
      .select('minutes')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      throw new Error(`Failed to fetch recent activity: ${recentError.message}`);
    }

    const recentMinutes = recentEntries?.reduce((sum, entry) => sum + entry.minutes, 0) || 0;
    const recentHours = recentMinutes / 60;

    // Get top 10 practitioners
    const top10Practitioners = userStatistics.slice(0, 10);

    logger.info('Statistics fetched successfully', {
      totalHours,
      progressPercentage,
    });

    return NextResponse.json({
      target: {
        minutes: targetMinutes,
        hours: targetHours,
      },
      collective: {
        totalMinutes,
        totalHours: parseFloat(totalHours.toFixed(2)),
        progressPercentage: parseFloat(progressPercentage.toFixed(2)),
        remainingMinutes: targetMinutes - totalMinutes,
        remainingHours: parseFloat(((targetMinutes - totalMinutes) / 60).toFixed(2)),
      },
      community: {
        totalUsers: totalUsers || 0,
        activeUsers,
        totalEntries: totalData?.length || 0,
      },
      recentActivity: {
        last7Days: {
          minutes: recentMinutes,
          hours: parseFloat(recentHours.toFixed(2)),
          entries: recentEntries?.length || 0,
        },
      },
      topPractitioners: top10Practitioners.map((user) => ({
        regNo: user.regNo,
        totalMinutes: user.totalMinutes,
        totalHours: parseFloat(user.totalHours.toFixed(2)),
        entryCount: user.entryCount,
        averageMinutesPerEntry: parseFloat((user.totalMinutes / user.entryCount).toFixed(2)),
      })),
      userStatistics: userStatistics.map((user) => ({
        regNo: user.regNo,
        totalMinutes: user.totalMinutes,
        totalHours: parseFloat(user.totalHours.toFixed(2)),
        entryCount: user.entryCount,
        averageMinutesPerEntry: parseFloat((user.totalMinutes / user.entryCount).toFixed(2)),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

