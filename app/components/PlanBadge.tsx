"use client";

import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { UserPlan, getPlanConfig, getResetDate } from "@/app/_types/plan.types";
import { Crown, Sparkles, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserPlanAction } from "@/app/_actions/plan-actions";

interface PlanBadgeProps {
    plan?: UserPlan;
    showDetails?: boolean;
}

const PlanIcon = ({ planType }: { planType: UserPlan['type'] }) => {
    switch (planType) {
        case 'gold':
            return <Crown className="h-4 w-4 text-amber-500" />;
        case 'silver':
            return <Sparkles className="h-4 w-4 text-slate-400" />;
        default:
            return <Gift className="h-4 w-4 text-gray-400" />;
    }
};

export function PlanBadge({ plan, showDetails = false }: PlanBadgeProps) {
    if (!plan) {
        return null;
    }

    const config = getPlanConfig(plan.type);
    const remaining = plan.type === 'gold' 
        ? 'نامحدود' 
        : Math.max(0, plan.questionLimit - plan.questionsUsed);
    const percentage = plan.type === 'gold' 
        ? 0 
        : (plan.questionsUsed / plan.questionLimit) * 100;

    const badgeClassNames = {
        free: "flex items-center gap-1 border-gray-500 text-gray-600",
        silver: "flex items-center gap-1 border-slate-500 text-slate-600",
        gold: "flex items-center gap-1 border-amber-500 text-amber-600",
    };

    if (!showDetails) {
        return (
            <Badge 
                variant="outline" 
                className={badgeClassNames[plan.type]}
            >
                <PlanIcon planType={plan.type} />
                <span>{config.nameFa}</span>
            </Badge>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PlanIcon planType={plan.type} />
                        پلن {config.nameFa}
                    </CardTitle>
                    <Badge 
                        variant="outline" 
                        className={badgeClassNames[plan.type]}
                    >
                        {config.nameFa}
                    </Badge>
                </div>
                <CardDescription>{config.descriptionFa}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">سوالات استفاده شده:</span>
                        <span className="font-medium">
                            {plan.questionsUsed} / {plan.type === 'gold' ? '∞' : plan.questionLimit}
                        </span>
                    </div>
                    {plan.type !== 'gold' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${
                                    plan.type === 'free' ? 'bg-gray-500' : 
                                    plan.type === 'silver' ? 'bg-slate-500' : 
                                    'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">سوالات باقی‌مانده:</span>
                        <span className="font-medium text-green-600">
                            {remaining}
                        </span>
                    </div>
                </div>
                {plan.type !== 'gold' && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                        ریست محدودیت: {getResetDate(plan).toLocaleDateString('fa-IR')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * کامپوننت برای نمایش پلن کاربر با fetch خودکار
 */
export function PlanBadgeAuto() {
    const [plan, setPlan] = useState<UserPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const userPlan = await getUserPlanAction();
                setPlan(userPlan);
            } catch (error) {
                console.error('Error fetching plan:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, []);

    if (loading) {
        return <div className="h-6 w-20 bg-gray-200 animate-pulse rounded" />;
    }

    if (!plan) {
        return null;
    }

    return <PlanBadge plan={plan} />;
}

