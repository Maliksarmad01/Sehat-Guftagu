"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    Brain,
    Database,
    Search,
    AlertCircle,
    Languages,
    FileText,
    ShieldCheck,
    Stethoscope,
    CheckCircle2,
    Sparkles
} from "lucide-react";

interface ThinkingStep {
    title: string;
    content: string;
}

interface ThinkingDropdownProps {
    steps: ThinkingStep[];
    ragSources?: string[];
    modelName?: string;
}

// Agent icons and colors mapping
const AGENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; description: string }> = {
    'TranslationAgent': {
        icon: Languages,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        description: 'Converting message for analysis'
    },
    'RAGRetrievalAgent': {
        icon: Search,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Searching medical knowledge base'
    },
    'HistoryFetchAgent': {
        icon: Database,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Loading patient history'
    },
    'DiseaseIdentificationAgent': {
        icon: Stethoscope,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        description: 'Analyzing potential conditions'
    },
    'ReasoningAgent': {
        icon: Brain,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        description: 'Generating clinical response'
    },
    'SafetyAgent': {
        icon: ShieldCheck,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Checking emergency red flags'
    },
    'default': {
        icon: Sparkles,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        description: 'Processing'
    }
};

// Parse agent data from step title/content
function parseAgentStep(step: ThinkingStep) {
    // Try to extract agent name from title
    const agentMatch = step.title.match(/^(\w+Agent)/);
    const agentName = agentMatch ? agentMatch[1] : step.title.split(':')[0]?.trim() || 'default';

    // Get config for this agent
    const config = AGENT_CONFIG[agentName] || AGENT_CONFIG['default'];

    // Parse content to extract meaningful details
    let details: Record<string, string | number | boolean> = {};

    try {
        // Try to parse JSON from content if it exists
        const jsonMatch = step.content.match(/\{.*\}/);
        if (jsonMatch) {
            details = JSON.parse(jsonMatch[0]);
        }
    } catch {
        // If parsing fails, use content as-is
    }

    // Format the action description
    let actionDescription = '';
    const action = step.title.split(':')[1]?.trim() || step.title;

    switch (agentName) {
        case 'TranslationAgent':
            actionDescription = 'Translated patient message for analysis';
            break;
        case 'RAGRetrievalAgent':
            const sources = details.sourcesFound || 0;
            const diseases = details.diseasesFound || 0;
            actionDescription = `Found ${sources} medical sources, ${diseases} related conditions`;
            break;
        case 'HistoryFetchAgent':
            actionDescription = details.hasHistory ? 'Patient history loaded successfully' : 'No prior history found';
            break;
        case 'DiseaseIdentificationAgent':
            const current = Number(details.currentDiseaseCount) || 0;
            const confidence = Number(details.confidence) || 0;
            const eliminated = Number(details.eliminatedThisTurn) || 0;
            actionDescription = `Analyzing ${current} conditions (${confidence}% confidence)${eliminated > 0 ? `, eliminated ${eliminated}` : ''}`;
            break;
        case 'ReasoningAgent':
            const conf = details.confidence || 0;
            actionDescription = `Generated response with ${conf}% confidence`;
            break;
        default:
            actionDescription = action;
    }

    return {
        agentName,
        config,
        actionDescription,
        rawAction: action,
        details
    };
}

export function ThinkingDropdown({ steps, ragSources, modelName = "Clinical AI" }: ThinkingDropdownProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!steps || steps.length === 0) return null;

    // Parse all steps
    const parsedSteps = steps.map(parseAgentStep);

    return (
        <div className="w-full">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                <Brain className="w-4 h-4" />
                <span>Show Thinking ({steps.length} agents)</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl space-y-4">
                            {/* Model name */}
                            <div className="flex items-center gap-2 text-xs text-gray-400 pb-2 border-b border-gray-200">
                                <Sparkles className="w-3 h-3" />
                                <span>Powered by {modelName}</span>
                            </div>

                            {/* Agent Steps with timeline */}
                            <div className="space-y-3">
                                {parsedSteps.map((parsed, index) => {
                                    const IconComponent = parsed.config.icon;
                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-start gap-3"
                                        >
                                            {/* Icon */}
                                            <div className={`w-8 h-8 ${parsed.config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <IconComponent className={`w-4 h-4 ${parsed.config.color}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-semibold text-sm ${parsed.config.color}`}>
                                                        {parsed.agentName.replace('Agent', ' Agent')}
                                                    </p>
                                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                </div>
                                                <p className="text-gray-600 text-xs mt-0.5">
                                                    {parsed.actionDescription}
                                                </p>

                                                {/* Show top diseases if DiseaseIdentificationAgent */}
                                                {parsed.agentName === 'DiseaseIdentificationAgent' && parsed.details.topDiseases && Array.isArray(parsed.details.topDiseases) && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {(parsed.details.topDiseases as unknown as any[]).slice(0, 3).map((d: any, i: number) => (
                                                            <span
                                                                key={i}
                                                                className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full"
                                                            >
                                                                {d.name} ({Math.round(d.probability)}%)
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* RAG Sources */}
                            {ragSources && ragSources.length > 0 && (
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                        <FileText className="w-3 h-3" />
                                        <span>Medical Knowledge Sources</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {ragSources.slice(0, 5).map((source, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
                                            >
                                                {source}
                                            </span>
                                        ))}
                                        {ragSources.length > 5 && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                                +{ragSources.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
