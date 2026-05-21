import { useState, useEffect } from 'react';
import { GraduationCap, Target, TrendingUp, BookOpen, ArrowRight, RefreshCw, Check, Play } from 'lucide-react';
import {
  DiscoveryIntake,
  TopicConfidenceGrid,
  DiagnosticQuiz,
  GapReportCard,
} from '@/components/assessment';
import { useGapAnalysis } from '@/hooks/useGapAnalysis';
import {
  type IntakeFormData,
  type TopicSelfAssessment,
  type DiagnosticResult,
  type AssessmentState,
  CoreTopic,
  YEAR_TOPIC_RELEVANCE,
} from '@/core/assessmentTypes';

type AssessmentStep = 'intake' | 'self_assessment' | 'diagnostic' | 'report';

export function AssessmentScreen() {
  const [step, setStep] = useState<AssessmentStep>('intake');
  const [intake, setIntake] = useState<IntakeFormData | null>(null);
  const [selfAssessments, setSelfAssessments] = useState<TopicSelfAssessment[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { gapReport } = useGapAnalysis({
    intake,
    selfAssessments,
    diagnostics,
  });

  const relevantTopics = intake 
    ? YEAR_TOPIC_RELEVANCE[intake.currentYear]
    : Object.values(CoreTopic);

  const handleIntakeComplete = (data: IntakeFormData) => {
    setIntake(data);
    setStep('self_assessment');
  };

  const handleSelfAssessmentComplete = (assessments: TopicSelfAssessment[]) => {
    setSelfAssessments(assessments);
    setStep('diagnostic');
  };

  const handleDiagnosticComplete = (results: DiagnosticResult[]) => {
    setDiagnostics(results);
    setIsGenerating(true);
    // Generate report after brief delay for effect
    setTimeout(() => {
      setIsGenerating(false);
      setStep('report');
    }, 1500);
  };

  const handleSkip = () => {
    // Skip intake with defaults
    setIntake({
      studentId: `student_${Date.now()}`,
      currentYear: 3,
      targetRoles: ['SDE'],
      targetCompanyTiers: ['FAANG'],
      coveredTopics: [],
      skipIntake: true,
    });
    setStep('self_assessment');
  };

  const resetAssessment = () => {
    setStep('intake');
    setIntake(null);
    setSelfAssessments([]);
    setDiagnostics([]);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Interview Prep
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover your readiness & build your path
        </p>
      </div>

      {/* Process Step Indicator */}
      {intake && (
        <div className="flex items-center gap-2 p-3 bg-gradient-card rounded-lg shadow-soft">
          {[
            { key: 'intake', label: 'Intake', icon: Target },
            { key: 'self_assessment', label: 'Self-Rate', icon: TrendingUp },
            { key: 'diagnostic', label: 'Quiz', icon: BookOpen },
            { key: 'report', label: 'Report', icon: Check },
          ].map(({ key, label, icon: Icon }, idx) => {
            const isActive = step === key;
            const isPast = ['intake', 'self_assessment', 'diagnostic', 'report'].indexOf(step) > idx;
            
            return (
              <div key={key} className="flex items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isPast 
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isPast ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs hidden sm:block ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 rounded ${
                    isPast ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step 1: Discovery Intake */}
      {step === 'intake' && (
        <DiscoveryIntake
          onComplete={handleIntakeComplete}
          onSkip={handleSkip}
        />
      )}

      {/* Step 2: Self Assessment */}
      {step === 'self_assessment' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-card rounded-lg shadow-soft">
            <h2 className="font-semibold">How confident are you?</h2>
            <p className="text-sm text-muted-foreground">
              Rate your comfort level (1-5) for each topic
            </p>
          </div>
          
          <TopicConfidenceGrid
            relevantTopics={relevantTopics}
            onSave={handleSelfAssessmentComplete}
          />
        </div>
      )}

      {/* Step 3: Diagnostic Quiz */}
      {step === 'diagnostic' && (
        <div className="space-y-4">
          {isGenerating ? (
            <div className="text-center py-12 space-y-4">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Analyzing your results...</p>
              <p className="text-sm text-muted-foreground">
                Generating your personalized learning path
              </p>
            </div>
          ) : (
            <DiagnosticQuiz
              topics={relevantTopics}
              questionCount={5}
              onComplete={handleDiagnosticComplete}
            />
          )}
        </div>
      )}

      {/* Step 4: Gap Report */}
      {step === 'report' && gapReport && (
        <div className="space-y-4">
          <GapReportCard gapReport={gapReport} />
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetAssessment}
              className="flex-1 py-3 border border-border rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retake Assessment
            </button>
            {gapReport.isReadyForInterviewPrep ? (
              <button className="flex-1 py-3 bg-gradient-cta text-white rounded-lg font-medium flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Start Prep
              </button>
            ) : (
              <button className="flex-1 py-3 bg-gradient-card border border-primary text-primary rounded-lg font-medium flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4" />
                My Learning Path
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentScreen;