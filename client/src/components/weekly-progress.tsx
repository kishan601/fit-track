import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Workout } from "@shared/schema";

interface WeeklyData {
  day: string;
  calories: number;
  workouts: number;
  duration: number;
  activityScore: number;
  color: string;
}

export function WeeklyProgress() {
  const { data: weeklyWorkouts, isLoading, refetch, error } = useQuery<Workout[]>({
    queryKey: ["/api/workouts/weekly"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const getWeeklyData = (): WeeklyData[] => {
    if (!weeklyWorkouts) return [];

    console.log('Raw weekly workouts data:', weeklyWorkouts);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    // Match the backend calculation exactly
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    console.log('Frontend calculated week start:', startOfWeek.toISOString());

    return days.map((day, index) => {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + index);
      
      const dayWorkouts = weeklyWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        
        // FIXED: Handle timezone properly by comparing dates in UTC
        const workoutYear = workoutDate.getUTCFullYear();
        const workoutMonth = workoutDate.getUTCMonth();
        const workoutDay = workoutDate.getUTCDate();
        
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentDay = currentDate.getDate();
        
        const isMatch = workoutYear === currentYear && 
                       workoutMonth === currentMonth && 
                       workoutDay === currentDay;
        
        console.log(`${day} ${currentDate.toDateString()}: checking workout ${workout.exerciseType} on ${workoutDate.toISOString()} = ${isMatch}`);
        
        return isMatch;
      });

      console.log(`${day}: ${dayWorkouts.length} workouts found`);

      const totalCalories = dayWorkouts.reduce((sum, workout) => sum + workout.calories, 0);
      const workoutCount = dayWorkouts.length;

      // Determine color based on primary exercise type
      let color = "from-slate-400 to-slate-500";
      if (dayWorkouts.length > 0) {
        const primaryType = dayWorkouts[0].exerciseType;
        switch (primaryType.toLowerCase()) {
          case "running":
          case "strength":
          case "weight training":
            color = "from-red-500 to-orange-400";
            break;
          case "cycling":
          case "swimming":
            color = "from-teal-500 to-cyan-400";
            break;
          case "yoga":
            color = "from-purple-500 to-indigo-400";
            break;
          case "hiit":
            color = "from-green-500 to-emerald-400";
            break;
          default:
            color = "from-blue-500 to-blue-400";
        }
      }

      const totalDuration = dayWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
      const activityScore = totalCalories * 0.4 + totalDuration * 2 * 0.6;

      return {
        day,
        calories: totalCalories,
        workouts: workoutCount,
        duration: totalDuration,
        activityScore,
        color,
      };
    });
  };

  const weeklyData = getWeeklyData();
  
  console.log('Final weekly data for chart:', weeklyData);
  
  const activityScores = weeklyData.map(day => day.activityScore);
  const maxActivityScore = Math.max(...activityScores, 50);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-2xl p-6 border border-gray-200 dark:border-border shadow-lg animate-slide-up">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-card rounded-2xl p-6 border border-gray-200 dark:border-border shadow-lg animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Weekly Progress</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Your activity over the last 7 days</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            data-testid="button-refresh-weekly"
          >
            <RefreshCw size={14} />
          </Button>
          <Select defaultValue="7days">
            <SelectTrigger className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg px-3 py-1 text-sm border-0 focus:ring-2 focus:ring-coral-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-96 relative" data-testid="weekly-progress-chart">
        <div className="absolute top-0 left-0 right-0 bottom-24 flex items-end justify-center gap-1 sm:gap-2 md:gap-4 px-2 sm:px-4">
          {weeklyData.map((day, index) => (
            <div key={day.day} className="flex flex-col items-center">
              <div className="w-8 sm:w-12 md:w-16 h-48 bg-slate-200 dark:bg-slate-700 rounded-lg relative overflow-hidden mb-3">
                <div
                  className={`bg-gradient-to-t ${day.color} rounded-lg transition-all duration-1000 ease-out hover:opacity-80 hover:scale-105 transform`}
                  style={{
                    height: `${Math.max((day.activityScore / maxActivityScore) * 100, day.activityScore > 0 ? 20 : 0)}%`,
                    minHeight: day.activityScore > 0 ? '24px' : '0px',
                    animationDelay: `${index * 0.1}s`,
                  }}
                  data-testid={`chart-bar-${day.day.toLowerCase()}`}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Labels positioned absolutely at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 sm:gap-2 md:gap-4 px-2 sm:px-4">
          {weeklyData.map((day, index) => (
            <div key={`label-${day.day}`} className="flex flex-col items-center space-y-1 w-8 sm:w-12 md:w-16">
              <div className={`text-xs sm:text-sm font-semibold ${day.day === 'Sat' && new Date().getDay() === 6 ? 'text-coral-500 dark:text-coral-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                {day.day}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="hidden sm:inline">{day.calories} cal</span>
                <span className="sm:hidden">{day.calories}</span>
              </div>
              {day.duration > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-500 text-center leading-tight">
                  <span className="hidden sm:inline">{day.duration}min • {day.workouts} workout{day.workouts > 1 ? 's' : ''}</span>
                  <span className="sm:hidden">{day.duration}m</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex justify-center space-x-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {weeklyData.reduce((sum, day) => sum + day.workouts, 0)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Workouts</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {weeklyData.reduce((sum, day) => sum + day.calories, 0)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Calories</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {weeklyData.reduce((sum, day) => sum + day.duration, 0)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Minutes</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-400 rounded-full" />
          <span className="text-xs text-slate-600 dark:text-slate-400">Strength</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full" />
          <span className="text-xs text-slate-600 dark:text-slate-400">Cardio</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" />
          <span className="text-xs text-slate-600 dark:text-slate-400">Yoga</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
          <span className="text-xs text-slate-600 dark:text-slate-400">HIIT</span>
        </div>
      </div>
    </div>
  );
}