import { string, trim, length, startsWith, pipe, minLength, maxLength, object} from 'valibot';

const MobileSchema = pipe(
    string(),
    trim(),
    length(11, 'شماره موبایل باید 11 رقم باشد'),
    startsWith('09', 'شماره موبایل باید با 09 شروع شود')
);

const VerificationCodeSchema = pipe(
    string(),
    trim(),
    length(6, 'کد تأیید باید 6 رقم باشد')
);

const PasswordSchema = pipe(
  string(),
  trim(),
  minLength(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد'),
  maxLength(32, 'رمز عبور نباید بیشتر از ۳۲ کاراکتر باشد')
);

export const MobileRequestSchema = object({
    mobile: MobileSchema
});

export const VerifyCodeSchema = object({
    mobile: MobileSchema,
    code: VerificationCodeSchema
});

export const SignInSchema = object({
    username: MobileSchema,
    password: PasswordSchema
})







