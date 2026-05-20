import { useState } from 'react';
import { GraduationCap, Target, Briefcase, ArrowRight, Check } from 'lucide-react';
import { 
  type StudentYear, 
  type TargetRole, 
  type CompanyTier, 
  type IntakeFormData,
  CoreTopic,
  YEAR_TOPIC_RELEVANCE,
} from '@/core/assessmentTypes';

interface DiscoveryIntakeProps {
  onComplete: (data: IntakeFormData) => void;
  onSkip?: () => void;
}

const STUDENT_YEARS: { value: StudentYear; label: string; desc: string }[] = [
  { value: 1, label: '1st Year', desc: 'Just started' },
  { value: 2, label: '2nd Year', desc: 'Settling in' },
  { value: 3, label: '3rd Year', desc: 'Mid-program' },
  { value: 4, label: '4th Year', desc: 'Preparing for placements' },
];

const TARGET_ROLES: { value: TargetRole; icon: string }[] = [
  { value: 'SDE', icon: '💻' },
  { value: 'Data Science', icon: '📊' },
  { value: 'ML/AI', icon: '🤖' },
  { value: 'DevOps', icon: '🔧' },
  { value: 'Frontend', icon: '🎨' },
  { value: 'Backend', icon: '⚙️' },
  { value: 'Full Stack', icon: '🌐' },
];

const COMPANY_TIERS: { value: CompanyTier; label: string }[] = [
  { value: 'FAANG', label: 'FAANG+' },
  { value: 'Startup', label: 'Startup' },
  { value: 'Product', label: 'Product' },
  { value: 'Service', label: 'Service' },
  { value: 'Consulting', label: 'Consulting' },
];

export function DiscoveryIntake({ onComplete, onSkip }: DiscoveryIntakeProps) {
  const [step, setStep] = useState(1);
  const [year, setYear] = useState<StudentYear | null>(null);
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [tiers, setTiers] = useState<CompanyTier[]>([]);
  const [coveredTopics, setCoveredTopics] = useState<CoreTopic[]>([]);

  const toggleRole = (role: TargetRole) => {
    setRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const toggleTier = (tier: CompanyTier) => {
    setTiers(prev => 
      prev.includes(tier) 
        ? prev.filter(t => t !== tier)
        : [...prev, tier]
    );
  };

  const toggleTopic = (topic: CoreTopic) => {
    setCoveredTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const canProceed = () => {
    if (step === 1) return year !== null;
    if (step === 2) return roles.length > 0;
    if (step === 3) return tiers.length > 0;
    return true;
  };

  const handleComplete = () => {
    const intakeData: IntakeFormData = {
      studentId: `student_${Date.now()}`,
      currentYear: year!,
      targetRoles: roles,
      targetCompanyTiers: tiers,
      coveredTopics,
      skipIntake: false,
    };
    onComplete(intakeData);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= s 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {step > s ? <Check className="w-4 h-4" /> : s}
          </div>
          {s < 3 && <div className={`w-8 h-1 mx-1 rounded ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-gradient-card flex items-center justify-center mx-auto shadow-soft">
          <GraduationCap className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Discover Your Readiness</h1>
        <p className="text-sm text-muted-foreground">
          Let's personalize your interview prep journey
        </p>
      </div>

      {renderStepIndicator()}

      {/* Step 1: Year */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-center">Which year are you in?</h2>
          <div className="grid grid-cols-2 gap-3">
            {STUDENT_YEARS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setYear(value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  year === value
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-semibold block">{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
          {year && YEAR_TOPIC_RELEVANCE[year].length > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Recommended topics for {year}{getOrdinal(year)} year:</p>
              <div className="flex flex-wrap gap-1">
                {YEAR_TOPIC_RELEVANCE[year].map(topic => (
                  <span key={topic} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Target Roles */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-center">What's your target role?</h2>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_ROLES.map(({ value, icon }) => (
              <button
                key={value}
                onClick={() => toggleRole(value)}
                className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${
                  roles.includes(value)
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{icon}</span>
                <span className="font-medium">{value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Company Tiers */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-center">Target company type?</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {COMPANY_TIERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleTier(value)}
                className={`px-4 py-2 rounded-full border-2 transition-all ${
                  tiers.includes(value)
                    ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Covered Topics (Optional) */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-center">Topics you've already studied?</h2>
          <p className="text-sm text-muted-foreground text-center">
            Select topics you're familiar with (optional)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(CoreTopic).map(topic => (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  coveredTopics.includes(topic)
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 border border-border rounded-lg font-medium"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-gradient-cta text-white rounded-lg font-medium disabled:opacity-50"
          >
            Next <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-gradient-cta text-white rounded-lg font-medium disabled:opacity-50"
          >
            Generate My Path <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        )}
      </div>

      {/* Skip Option */}
      {onSkip && step === 1 && (
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-muted-foreground hover:text-primary"
        >
          Skip for now →
        </button>
      )}
    </div>
  );
}

// Helper for ordinal suffix
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default DiscoveryIntake;