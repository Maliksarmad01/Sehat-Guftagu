'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  Mic,
  User,
  Stethoscope,
  ClipboardList,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Heart,
  Shield,
  Clock,
  Globe,
} from 'lucide-react';

// Documentation sections
const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Home,
    content: `
## Welcome to Sehat Guftagu 🏥

Sehat Guftagu (صحت گفتگو) is your AI-powered health companion. This platform helps you have medical consultations in Urdu or English, and connects you with qualified doctors.

### What Can You Do Here?

- **Talk to AI Doctor**: Describe your symptoms in Urdu or English
- **Voice or Text**: Choose how you want to communicate
- **Get Medical Reports**: Receive professional SOAP reports
- **Connect with Doctors**: Your reports are reviewed by real doctors
- **Download Prescriptions**: Get your prescription as a PDF

### Quick Navigation

- **New Patients**: Start by creating an account and completing your medical history
- **Returning Patients**: Log in to continue your healthcare journey
- **Doctors**: Access your dashboard to review patient reports
    `,
  },
  {
    id: 'for-patients',
    title: 'For Patients',
    icon: User,
    content: `
## Patient Guide

### Creating Your Account

1. Click "Sign Up" on the homepage
2. Enter your email and create a password
3. Select "Patient" as your role
4. Complete your medical history onboarding

### Medical History Onboarding

Before your first interview, you'll answer 15 questions about:
- Basic info (age, gender, blood group)
- Current medications
- Allergies
- Family medical history
- Lifestyle factors

**Tip**: Be honest and thorough - this helps the AI give better recommendations!

### Starting a Clinical Interview

1. Go to your Dashboard
2. Click "Start New Interview"
3. Choose Voice or Text mode
4. Describe your symptoms clearly
5. Answer the AI's follow-up questions

### Understanding Your Report

After your interview, a SOAP report is generated:
- **Subjective**: Your symptoms in your own words
- **Objective**: Medical observations
- **Assessment**: Possible diagnosis
- **Plan**: Recommended next steps

### Getting Your Prescription

1. Wait for a doctor to review your report
2. Check your dashboard for "Approved" status
3. Click "Download Prescription"
    `,
  },
  {
    id: 'voice-mode',
    title: 'Using Voice Mode',
    icon: Mic,
    content: `
## Voice Mode Guide

### How It Works

1. Click the microphone icon
2. Speak clearly in Urdu or English
3. Wait for the AI to respond
4. Listen to the response or read the text

### Tips for Best Results

- **Speak clearly**: Moderate pace, clear pronunciation
- **Quiet environment**: Find a quiet place for recording
- **Complete sentences**: Describe symptoms fully
- **Wait for the beep**: Start speaking after the recording indicator appears

### Supported Languages

- 🇵🇰 **Urdu** (اردو) - Full support
- 🇬🇧 **English** - Full support
- Mix both languages naturally!

### Troubleshooting

**Microphone not working?**
- Check browser permissions
- Allow microphone access when prompted
- Try refreshing the page

**Can't hear responses?**
- Check your device volume
- Enable audio autoplay in browser
- Try the text mode as backup
    `,
  },
  {
    id: 'for-doctors',
    title: 'For Doctors',
    icon: Stethoscope,
    content: `
## Doctor Guide

### Creating Your Profile

1. Sign up and select "Doctor" role
2. Complete your professional profile:
   - Full name and contact
   - Specialization
   - Qualifications (MBBS, FCPS, etc.)
   - License number
   - Hospital/Clinic
   - Department

### Your Dashboard

Your dashboard shows:
- **Pending Reports**: Waiting for your review
- **Today's Reviews**: Your activity today
- **Statistics**: Total reviews, average rating

Reports are automatically filtered by your department.

### Reviewing Reports

1. Click on a report to view details
2. Review the SOAP sections:
   - Patient's complaints
   - AI assessment
   - Recommended tests
3. Choose an action:
   - ✅ **Approve**: Confirm the report is accurate
   - ❌ **Reject**: Request AI to regenerate with feedback
   - 📝 **Add Notes**: Include additional observations

### Writing Prescriptions

1. After approving a report, add your prescription
2. Include:
   - Medications with dosage
   - Duration
   - Special instructions
3. The patient can download this as a PDF

### Star Rating

Rate the AI's report quality (1-5 stars) to help improve the system.
    `,
  },
  {
    id: 'reports',
    title: 'Understanding Reports',
    icon: ClipboardList,
    content: `
## SOAP Reports Explained

### What is SOAP?

SOAP is a standard medical documentation format:

### S - Subjective
What you told us about your symptoms:
- Chief complaint (main issue)
- How long you've had symptoms
- What makes it better or worse
- Your own description

### O - Objective
Medical observations and data:
- Reported symptoms
- Severity assessment
- Relevant vital signs
- Confidence level

### A - Assessment
The AI's analysis:
- Primary diagnosis (most likely condition)
- Differential diagnosis (other possibilities)
- Red flags detected
- Confidence percentage

### P - Plan
Recommended next steps:
- Suggested tests
- Specialist referrals
- Medications (if approved by doctor)
- Follow-up recommendations

### Triage Labels

Your report may have a priority label:
- 🔴 **Emergency**: Seek immediate care
- 🟠 **Urgent**: See a doctor soon
- 🟡 **Standard**: Schedule an appointment
- 🟢 **Routine**: Regular checkup sufficient
    `,
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    content: `
## Your Privacy Matters

### Data We Collect

- Account information (email, name)
- Medical history (for better diagnoses)
- Interview conversations
- Generated reports

### How We Protect You

- 🔐 **Encrypted Storage**: All data is encrypted
- 🏥 **HIPAA Principles**: Following healthcare privacy standards
- 👨‍⚕️ **Doctor Review**: Reports reviewed by licensed professionals
- 🚫 **No Selling Data**: We never sell your information

### Your Rights

- ✅ Access your data anytime
- ✅ Download your reports
- ✅ Request data deletion
- ✅ Correct inaccurate information

### Data Retention

- Active accounts: Data retained while active
- Deleted accounts: Data removed within 30 days
- Medical records: Kept per regulatory requirements
    `,
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    content: `
## Frequently Asked Questions

### General

**Q: Is this a replacement for seeing a real doctor?**
A: No. Sehat Guftagu is a preliminary consultation tool. Always follow up with a licensed physician for serious concerns.

**Q: What languages are supported?**
A: Urdu and English, including mixing both.

**Q: Is the service free?**
A: The basic interview service is free. Check for premium features.

### Technical

**Q: Which browsers work best?**
A: Chrome, Firefox, and Edge (latest versions). Safari may have limited voice support.

**Q: Why is my microphone not working?**
A: Check browser permissions, refresh the page, or try a different browser.

**Q: Can I use this on mobile?**
A: Yes! The website is mobile-friendly.

### Medical

**Q: How accurate is the AI diagnosis?**
A: The AI provides suggestions based on symptoms, but all reports are reviewed by doctors. Accuracy improves with detailed information.

**Q: What if it's an emergency?**
A: The system detects emergencies and will alert you. Always call emergency services (1166) for life-threatening situations.

**Q: Can I get medicine from here?**
A: Prescriptions are written by verified doctors, but you'll need to purchase medicines from a pharmacy.

### Account

**Q: I forgot my password**
A: Use the "Forgot Password" link on the login page.

**Q: Can I delete my account?**
A: Yes, contact support to request account deletion.

**Q: Is my conversation private?**
A: Yes, only you and your assigned doctor can see your conversations.
    `,
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-16'} bg-slate-800/50 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm">Back to Home</span>}
          </Link>
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-emerald-400" />
                Sehat Guftagu
              </h1>
              <p className="text-slate-400 text-sm">User Documentation</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">
                          {section.title}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`}
                        />
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700 text-center">
            <p className="text-slate-500 text-xs">صحت گفتگو v2.0</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <h2 className="text-xl font-semibold text-white">
              {currentSection?.title}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Globe className="w-4 h-4" />
              <span className="text-sm">EN / اردو</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Quick Info Cards */}
          {activeSection === 'getting-started' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-6 border border-emerald-500/30">
                <Mic className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">Voice Support</h3>
                <p className="text-slate-400 text-sm">
                  Speak in Urdu or English
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30">
                <Shield className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">
                  Doctor Verified
                </h3>
                <p className="text-slate-400 text-sm">
                  All reports reviewed by doctors
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-6 border border-purple-500/30">
                <Clock className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">
                  24/7 Available
                </h3>
                <p className="text-slate-400 text-sm">
                  Start consultations anytime
                </p>
              </div>
            </div>
          )}

          {/* Markdown-style Content */}
          <article className="prose prose-invert prose-emerald max-w-none">
            {currentSection?.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h2
                    key={i}
                    className="text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-3"
                  >
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3
                    key={i}
                    className="text-lg font-semibold text-emerald-400 mt-6 mb-3"
                  >
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="text-slate-300 ml-4 list-disc">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              if (line.startsWith('**Q:')) {
                return (
                  <p key={i} className="font-semibold text-white mt-4">
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              }
              if (line.startsWith('A:')) {
                return (
                  <p key={i} className="text-slate-400 mb-4">
                    {line.replace('A: ', '')}
                  </p>
                );
              }
              if (line.startsWith('**Tip**') || line.startsWith('**')) {
                return (
                  <p
                    key={i}
                    className="text-amber-400 bg-amber-500/10 px-4 py-2 rounded-lg my-2"
                  >
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              }
              if (line.match(/^\d\./)) {
                return (
                  <li key={i} className="text-slate-300 ml-4 list-decimal">
                    {line.replace(/^\d\./, '').trim()}
                  </li>
                );
              }
              if (line.trim() === '') return null;
              return (
                <p key={i} className="text-slate-300 leading-relaxed">
                  {line}
                </p>
              );
            })}
          </article>

          {/* Navigation Footer */}
          <div className="mt-12 pt-8 border-t border-slate-700 flex justify-between">
            {sections.findIndex(s => s.id === activeSection) > 0 && (
              <button
                onClick={() => {
                  const idx = sections.findIndex(s => s.id === activeSection);
                  setActiveSection(sections[idx - 1].id);
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous:{' '}
                {
                  sections[sections.findIndex(s => s.id === activeSection) - 1]
                    ?.title
                }
              </button>
            )}
            {sections.findIndex(s => s.id === activeSection) <
              sections.length - 1 && (
              <button
                onClick={() => {
                  const idx = sections.findIndex(s => s.id === activeSection);
                  setActiveSection(sections[idx + 1].id);
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors ml-auto"
              >
                Next:{' '}
                {
                  sections[sections.findIndex(s => s.id === activeSection) + 1]
                    ?.title
                }
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
