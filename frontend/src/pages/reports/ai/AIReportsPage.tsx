// صفحة تقارير الذكاء الاصطناعي

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Sparkles,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Lightbulb,
  MessageCircle,
  BarChart3,
  ArrowRight,
  Bot,
  User,
  RefreshCw,
  Zap,
  Shield,
  Target,
  ArrowLeft,
} from 'lucide-react';
import { aiReportApi } from '@/api/reports/ai.api';
import type { AiInsight, AiRecommendation, AiAnalysis } from '@/api/reports/ai.api';
import { formatCurrency, fadeInUp, staggerContainer } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// Suggested questions
const suggestedQuestions = [
  'ما هو الوضع المالي العام للمتجر؟',
  'ما هي أكثر المنتجات ربحية؟',
  'كيف يمكنني تقليل المصروفات؟',
  'ما هو اتجاه المبيعات هذا الشهر؟',
  'هل هناك عملاء متأخرين في السداد؟',
  'ما هي نسبة هامش الربح الحالية؟',
];

const AIReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // جلب الرؤى السريعة
  const {
    data: insightsData,
    isLoading: insightsLoading,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ['ai-quick-insights'],
    queryFn: async () => {
      const res = await aiReportApi.getQuickInsights();
      return res.data;
    },
  });

  // Mutation للدردشة
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await aiReportApi.chat(message);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success && data.response) {
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: data.error || 'عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى.',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      }
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content: 'عذراً، فشل الاتصال بخدمة الذكاء الاصطناعي. تأكد من الاتصال بالإنترنت.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    },
  });

  // التمرير لآخر رسالة
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (message?: string) => {
    const msg = message || inputMessage.trim();
    if (!msg || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    chatMutation.mutate(msg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const analysis: AiAnalysis | null = insightsData?.parsed ? (insightsData.analysis ?? null) : null;
  const financialData = insightsData?.data as Record<string, Record<string, number>> | undefined;

  const getInsightIcon = (type: AiInsight['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'danger':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type: AiInsight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'danger':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  const getPriorityBadge = (priority: AiRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">عالية</Badge>;
      case 'medium':
        return <Badge className="text-xs bg-amber-500 hover:bg-amber-600">متوسطة</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">منخفضة</Badge>;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHealthGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-600';
    if (score >= 60) return 'from-blue-500 to-indigo-600';
    if (score >= 40) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
      dir="rtl"
    >
      {/* رأس الصفحة */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/reports')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                <Brain className="h-8 w-8 text-white" />
              </div>
              تقرير الذكاء الاصطناعي
            </h1>
            <p className="text-muted-foreground mt-2">
              تحليل مالي ذكي ورؤى لحظية مدعومة بالذكاء الاصطناعي
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchInsights()}
            disabled={insightsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${insightsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* بطاقة الصحة المالية */}
      <motion.div variants={fadeInUp}>
        {insightsLoading ? (
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-2 w-64" />
              </div>
            </CardContent>
          </Card>
        ) : analysis ? (
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className={`bg-gradient-to-br ${getHealthGradient(analysis.health_score)} p-1`}>
              <div className="bg-background rounded-lg p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* درجة الصحة */}
                  <div className="flex flex-col items-center gap-3 min-w-[200px]">
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60" cy="60" r="50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted/20"
                        />
                        <circle
                          cx="60" cy="60" r="50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${(analysis.health_score / 100) * 314} 314`}
                          strokeLinecap="round"
                          className={getHealthColor(analysis.health_score)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${getHealthColor(analysis.health_score)}`}>
                          {analysis.health_score}
                        </span>
                        <span className="text-xs text-muted-foreground">من 100</span>
                      </div>
                    </div>
                    <Badge className={`bg-gradient-to-r ${getHealthGradient(analysis.health_score)} text-white border-0 text-sm px-4 py-1`}>
                      {analysis.health_label}
                    </Badge>
                  </div>

                  {/* الملخص والاتجاهات */}
                  <div className="flex-1 space-y-4 text-center md:text-right">
                    <div>
                      <h2 className="text-xl font-bold mb-2 flex items-center gap-2 justify-center md:justify-start">
                        <Sparkles className="h-5 w-5 text-violet-500" />
                        ملخص التحليل الذكي
                      </h2>
                      <p className="text-muted-foreground leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>

                    {/* الاتجاهات */}
                    <div className="flex gap-6 justify-center md:justify-start">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(analysis.trends.revenue_trend)}
                        <span className="text-sm">الإيرادات</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(analysis.trends.profit_trend)}
                        <span className="text-sm">الأرباح</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(analysis.trends.expenses_trend)}
                        <span className="text-sm">المصروفات</span>
                      </div>
                    </div>

                    {/* بيانات سريعة */}
                    {financialData?.current && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">الإيرادات</p>
                          <p className="font-bold text-sm">{formatCurrency(financialData.current.revenue || 0)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">صافي الربح</p>
                          <p className="font-bold text-sm">{formatCurrency(financialData.current.net_profit || 0)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">المصروفات</p>
                          <p className="font-bold text-sm">{formatCurrency(financialData.current.expenses || 0)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">هامش الربح</p>
                          <p className="font-bold text-sm">{financialData.current.profit_margin || 0}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : insightsData && !insightsData.success ? (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">فشل التحليل</h3>
              <p className="text-muted-foreground mb-4">{insightsData.error || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي'}</p>
              <Button onClick={() => refetchInsights()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </motion.div>

      {/* الرؤى والتوصيات */}
      {analysis && (
        <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-2">
          {/* الرؤى */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                الرؤى الذكية
              </CardTitle>
              <CardDescription>تحليلات ومشاهدات مبنية على بياناتك المالية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.insights?.length > 0 ? (
                analysis.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border ${getInsightBg(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد رؤى متاحة</p>
              )}
            </CardContent>
          </Card>

          {/* التوصيات */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900">
                  <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                التوصيات
              </CardTitle>
              <CardDescription>اقتراحات لتحسين الأداء المالي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.recommendations?.length > 0 ? (
                analysis.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-muted/50 border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-semibold text-sm">{rec.title}</h4>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {rec.description}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد توصيات متاحة</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* قسم الدردشة */}
      <motion.div variants={fadeInUp}>
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              اسأل الذكاء الاصطناعي
            </CardTitle>
            <CardDescription>
              اطرح أي سؤال عن أمورك المالية واحصل على إجابة فورية
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {/* منطقة الرسائل */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 mb-4">
                    <Bot className="h-12 w-12 text-violet-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">مرحباً! أنا مساعدك المالي الذكي 🤖</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-md">
                    اسألني أي سؤال عن وضعك المالي، المبيعات، الأرباح، المصروفات، أو أي شيء يتعلق بنشاطك التجاري
                  </p>

                  {/* أسئلة مقترحة */}
                  <div className="grid gap-2 w-full max-w-lg">
                    <p className="text-xs text-muted-foreground font-medium">أسئلة مقترحة:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestedQuestions.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-300"
                          onClick={() => handleSendMessage(q)}
                        >
                          <Sparkles className="h-3 w-3 text-violet-500" />
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'ai'
                            ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                            : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        }`}>
                          {msg.role === 'ai' ? (
                            <Bot className="h-4 w-4 text-white" />
                          ) : (
                            <User className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            {msg.timestamp.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* حالة الكتابة */}
                  {chatMutation.isPending && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* حقل الإدخال */}
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="اكتب سؤالك هنا..."
                  className="flex-1 bg-background"
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {chatMessages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground hover:text-violet-600"
                      onClick={() => handleSendMessage(q)}
                      disabled={chatMutation.isPending}
                    >
                      <Sparkles className="h-3 w-3 ml-1" />
                      {q}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ميزات تقرير AI */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50 dark:border-violet-800/50">
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="bg-violet-100 dark:bg-violet-900 p-2 rounded-lg shrink-0">
                  <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تحليل ذكي</h4>
                  <p className="text-xs text-muted-foreground">تحليل شامل لبياناتك المالية</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg shrink-0">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">كشف المخاطر</h4>
                  <p className="text-xs text-muted-foreground">تنبيهات مبكرة عن المشاكل</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-fuchsia-100 dark:bg-fuchsia-900 p-2 rounded-lg shrink-0">
                  <Zap className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">إجابات فورية</h4>
                  <p className="text-xs text-muted-foreground">أجوبة سريعة لأسئلتك المالية</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg shrink-0">
                  <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">توصيات مخصصة</h4>
                  <p className="text-xs text-muted-foreground">نصائح مبنية على بياناتك</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AIReportsPage;
export { AIReportsPage };
