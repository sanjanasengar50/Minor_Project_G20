import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Sparkles } from 'lucide-react';

interface StudentInfo {
  id: string;
  branch: string;
  semester: number;
}

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Computer Science',
  'Data Structures',
  'Algorithms',
  'Database Systems',
  'Operating Systems',
  'Software Engineering',
  'Machine Learning',
  'Web Development',
];

const CATEGORIES = [
  'Teaching Quality',
  'Course Content',
  'Lab Sessions',
  'Assignments',
  'Examinations',
  'Infrastructure',
  'Library Resources',
  'General',
];

export default function SubmitFeedback() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudentInfo();
    }
  }, [user]);

  const fetchStudentInfo = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, branch, semester')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    if (data) setStudentInfo(data);
  };

  const analyzeSentiment = async (text: string): Promise<string> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { text },
      });
      
      if (error) throw error;
      return data.sentiment || 'Neutral';
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      // Fallback to simple keyword-based analysis
      const lowerText = text.toLowerCase();
      if (lowerText.includes('excellent') || lowerText.includes('great') || lowerText.includes('good') || lowerText.includes('helpful') || lowerText.includes('amazing')) {
        return 'Positive';
      } else if (lowerText.includes('bad') || lowerText.includes('poor') || lowerText.includes('terrible') || lowerText.includes('worst') || lowerText.includes('disappointed')) {
        return 'Negative';
      }
      return 'Neutral';
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentInfo) {
      toast({
        title: 'Error',
        description: 'Student information not found',
        variant: 'destructive',
      });
      return;
    }

    if (!subject || !category || !feedbackText.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Analyze sentiment using AI
      const sentiment = await analyzeSentiment(feedbackText);
      
      const { error } = await supabase.from('feedback').insert({
        student_id: studentInfo.id,
        subject,
        category,
        feedback_text: feedbackText,
        sentiment,
        branch: studentInfo.branch,
        semester: studentInfo.semester,
      });

      if (error) throw error;

      toast({
        title: 'Feedback Submitted',
        description: `Your feedback was classified as ${sentiment}`,
      });
      
      navigate('/student');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Submit Feedback">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Submit New Feedback
            </CardTitle>
            <CardDescription>
              Your feedback will be analyzed using AI to determine sentiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback *</Label>
                <Textarea
                  id="feedback"
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {feedbackText.length}/1000 characters
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/student')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isAnalyzing} className="flex-1">
                  {isSubmitting || isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isAnalyzing ? 'Analyzing...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
