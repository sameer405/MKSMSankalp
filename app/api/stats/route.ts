import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
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

