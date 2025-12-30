import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/cards/StatCard';
import SentimentPieChart from '@/components/charts/SentimentPieChart';
import FeedbackBarChart from '@/components/charts/FeedbackBarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, TrendingUp, BarChart3, PieChart } from 'lucide-react';

interface FeedbackItem {
  id: string;
  subject: string;
  category: string;
  feedback_text: string;
  sentiment: string;
  branch: string;
  semester: number;
  created_at: string;
}

export default function FacultyDashboard() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, subject, category, feedback_text, sentiment, branch, semester, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = [
    { name: 'Positive', value: feedback.filter(f => f.sentiment === 'Positive').length, color: 'hsl(142, 76%, 36%)' },
    { name: 'Neutral', value: feedback.filter(f => f.sentiment === 'Neutral').length, color: 'hsl(220, 10%, 50%)' },
    { name: 'Negative', value: feedback.filter(f => f.sentiment === 'Negative').length, color: 'hsl(0, 84%, 60%)' },
  ];

  const branchData = feedback.reduce((acc: { name: string; count: number }[], item) => {
    const existing = acc.find(d => d.name === item.branch);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: item.branch, count: 1 });
    }
    return acc;
  }, []);

  const categoryData = feedback.reduce((acc: { name: string; count: number }[], item) => {
    const existing = acc.find(d => d.name === item.category);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: item.category, count: 1 });
    }
    return acc;
  }, []);

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

  const recentFeedback = feedback.slice(0, 8);

  return (
    <DashboardLayout title="Faculty Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Feedback"
            value={feedback.length}
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <StatCard
            title="Positive Rate"
            value={`${feedback.length > 0 ? Math.round((sentimentData[0].value / feedback.length) * 100) : 0}%`}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Categories"
            value={categoryData.length}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <StatCard
            title="Branches"
            value={branchData.length}
            icon={<PieChart className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>Overall sentiment distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <SentimentPieChart data={sentimentData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback by Branch</CardTitle>
              <CardDescription>Distribution across branches</CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackBarChart data={branchData} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedback (Anonymized) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest anonymous feedback entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {recentFeedback.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.subject}</p>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                      {getSentimentBadge(item.sentiment)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.feedback_text}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{item.branch}</span>
                      <span>Semester {item.semester}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
