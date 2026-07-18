/**
 * انواع پلن‌های کاربری
 */
export type PlanType = 'free' | 'silver' | 'gold';

/**
 * اطلاعات پلن کاربر
 * توجه: resetDate به صورت string (ISO) ذخیره می‌شود تا در JWT قابل سریالایز باشد
 */
export interface UserPlan {
    type: PlanType;
    questionLimit: number; // تعداد سوالات مجاز در ماه
    questionsUsed: number; // تعداد سوالات استفاده شده
    resetDate: string; // تاریخ ریست شدن محدودیت (ISO string)
}

// Re-export types for type-only imports
export type { UserPlan as UserPlanType, PlanType as PlanTypeType };

/**
 * تنظیمات هر پلن
 */
export interface PlanConfig {
    type: PlanType;
    name: string;
    nameFa: string;
    questionLimit: number;
    description: string;
    descriptionFa: string;
    color: string;
}

/**
 * تنظیمات تمام پلن‌ها
 */
export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
    free: {
        type: 'free',
        name: 'Free',
        nameFa: 'رایگان',
        questionLimit: 10, // 10 سوال در ماه
        description: 'Basic plan with limited questions',
        descriptionFa: 'پلن پایه با تعداد محدود سوال',
        color: 'gray',
    },
    silver: {
        type: 'silver',
        name: 'Silver',
        nameFa: 'نقره‌ای',
        questionLimit: 50, // 50 سوال در ماه
        description: 'Intermediate plan with more questions',
        descriptionFa: 'پلن متوسط با سوالات بیشتر',
        color: 'slate',
    },
    gold: {
        type: 'gold',
        name: 'Gold',
        nameFa: 'طلایی',
        questionLimit: -1, // نامحدود
        description: 'Premium plan with unlimited questions',
        descriptionFa: 'پلن پریمیوم با سوالات نامحدود',
        color: 'amber',
    },
};

/**
 * دریافت تنظیمات یک پلن
 */
export function getPlanConfig(planType: PlanType): PlanConfig {
    return PLAN_CONFIGS[planType];
}

/**
 * بررسی اینکه آیا کاربر می‌تواند سوال بپرسد
 */
export function canAskQuestion(plan: UserPlan): { canAsk: boolean; reason?: string } {
    const config = getPlanConfig(plan.type);
    
    // پلن طلایی نامحدود است
    if (plan.type === 'gold') {
        return { canAsk: true };
    }
    
    // بررسی محدودیت
    if (plan.questionsUsed >= plan.questionLimit) {
        return {
            canAsk: false,
            reason: `شما به محدودیت سوالات پلن ${config.nameFa} خود رسیده‌اید. لطفا پلن خود را ارتقا دهید.`,
        };
    }
    
    return { canAsk: true };
}

/**
 * ایجاد پلن پیش‌فرض (رایگان)
 */
export function createDefaultPlan(): UserPlan {
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // اول ماه بعد
    
    return {
        type: 'free',
        questionLimit: PLAN_CONFIGS.free.questionLimit,
        questionsUsed: 0,
        resetDate: resetDate.toISOString(), // ذخیره به صورت ISO string
    };
}

/**
 * تبدیل resetDate به Date object
 */
export function getResetDate(plan: UserPlan): Date {
    return new Date(plan.resetDate);
}

