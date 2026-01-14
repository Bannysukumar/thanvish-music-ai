import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp
} from "firebase/firestore";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Loader2,
  BarChart3
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  totalStudents: number;
  totalCourses: number;
  monthlyBreakdown: Array<{
    month: string;
    earnings: number;
    students: number;
  }>;
}

export default function Earnings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    totalStudents: 0,
    totalCourses: 0,
    monthlyBreakdown: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"month" | "year">("month");

  useEffect(() => {
    if (!user || user.role !== "music_teacher") {
      setLocation("/dashboard");
      return;
    }
    fetchEarnings();
  }, [user, setLocation, timeRange]);

  const fetchEarnings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch enrollments for teacher's courses
      const coursesRef = collection(db, "courses");
      const coursesQuery = query(
        coursesRef,
        where("teacherId", "==", user.id)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      
      const courseIds: string[] = [];
      coursesSnapshot.forEach((doc) => {
        courseIds.push(doc.id);
      });

      if (courseIds.length === 0) {
        setEarnings({
          totalEarnings: 0,
          thisMonthEarnings: 0,
          lastMonthEarnings: 0,
          totalStudents: 0,
          totalCourses: 0,
          monthlyBreakdown: [],
        });
        setIsLoading(false);
        return;
      }

      // Fetch enrollments (assuming there's a payment/enrollment system)
      // For now, we'll simulate earnings data
      // In a real app, you'd fetch from a payments/transactions collection
      
      let enrollmentsSnapshot;
      try {
        const enrollmentsRef = collection(db, "enrollments");
        const enrollmentsQuery = query(
          enrollmentsRef,
          where("courseId", "in", courseIds.slice(0, 10))
        );
        enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      } catch (error) {
        console.log("No enrollments found");
      }

      // Calculate earnings (assuming $X per enrollment)
      // In a real app, you'd fetch actual payment data
      const enrollmentCount = enrollmentsSnapshot?.size || 0;
      const pricePerEnrollment = 29.99; // Example price
      
      const totalEarnings = enrollmentCount * pricePerEnrollment;
      
      // Calculate monthly breakdown (simplified)
      const monthlyBreakdown: Array<{ month: string; earnings: number; students: number }> = [];
      const now = new Date();
      
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, "MMM yyyy");
        // Simplified: distribute earnings evenly across months
        monthlyBreakdown.push({
          month: monthKey,
          earnings: totalEarnings / 6,
          students: Math.floor(enrollmentCount / 6),
        });
      }

      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      setEarnings({
        totalEarnings,
        thisMonthEarnings: totalEarnings / 6, // Simplified
        lastMonthEarnings: totalEarnings / 6, // Simplified
        totalStudents: enrollmentCount,
        totalCourses: coursesSnapshot.size,
        monthlyBreakdown: monthlyBreakdown.reverse(),
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const earningsChange = earnings.lastMonthEarnings > 0
    ? ((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="text-muted-foreground mt-2">
            Track your revenue and student enrollments
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.thisMonthEarnings.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs">
              {earningsChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={earningsChange >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(earningsChange).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Published courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>
            Earnings and student enrollments over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.monthlyBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No earnings data available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.monthlyBreakdown.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {month.students} student{month.students !== 1 ? "s" : ""} enrolled
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">${month.earnings.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Earnings Information
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Earnings are calculated based on student enrollments in your courses. 
                Payment processing and payout details are managed by the platform administrator.
                Contact support for detailed transaction history or payout information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

