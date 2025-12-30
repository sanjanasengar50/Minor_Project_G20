import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/cards/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, FileText, TrendingUp, Plus } from 'lucide-react';

interface StudentInfo {
  id: string;
  roll_number: string;
  branch: string;
  semester: number;
}

interface FeedbackItem {
  id: string;
  subject: string;
  sentiment: string;
  created_at: string;
}

interface Profile {
  full_name: string;
  email: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [studentRes, profileRes] = await Promise.all([
        supabase.from('students').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user?.id).maybeSingle(),
      ]);

      if (studentRes.data) {
        setStudentInfo(studentRes.data);
        
        const { data: feedbackData } = await supabase
          .from('feedback')
          .select('id, subject, sentiment, created_at')
          .eq('student_id', studentRes.data.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (feedbackData) setFeedback(feedbackData);
      }
      
      if (profileRes.data) setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const positiveCount = feedback.filter(f => f.sentiment === 'Positive').length;
  const initials = profile?.full_name?.substring(0, 2).toUpperCase() || 'ST';

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return <Badge className="bg-success text-success-foreground">Positive</Badge>;
      case 'Negative':
        return <Badge className="bg-destructive text-destructive-foreground">Negative</Badge>;
      default:
        return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  return (
    <DashboardLayout title="My Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile?.full_name || 'Student'}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
                {studentInfo && (
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline">{studentInfo.branch}</Badge>
                    <Badge variant="outline">Semester {studentInfo.semester}</Badge>
                    <Badge variant="secondary" className="font-mono">{studentInfo.roll_number}</Badge>
                  </div>
                )}
              </div>
              <Button asChild>
                <Link to="/student/feedback">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="My Feedback"
            value={feedback.length}
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <StatCard
            title="Positive Submissions"
            value={positiveCount}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="This Semester"
            value={studentInfo?.semester || '-'}
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>My Recent Feedback</CardTitle>
            <CardDescription>Your latest feedback submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't submitted any feedback yet</p>
                <Button asChild>
                  <Link to="/student/feedback">Submit Your First Feedback</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {feedback.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getSentimentBadge(item.sentiment)}
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/student/history">View All Feedback</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
