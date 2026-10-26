import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";

const AuthForm = ({
  isLogin,
  isVerifying,
  isProcessing = false,
  form,
  handleChange,
  handleSubmit,
  setIsLogin,
  setIsVerifying,
  handleResendOTP,
  handleFillDemo,
  handleQuickDemoLogin,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isVerifying) {
      setTimeLeft(30);
      return;
    }
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerifying, timeLeft]);

  const onResendClick = () => {
    if (timeLeft > 0 || isProcessing) return;
    handleResendOTP();
    setTimeLeft(30);
  };

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <img
          src="/images/CogniFlow.png"
          alt="CogniFlow"
          className="w-10 h-10 object-contain"
        />
      </div>

      {/* Title & Subtitle */}
      <h1 className="text-center text-[22px] font-semibold text-[var(--text-primary)] leading-tight tracking-[-0.01em]">
        {isVerifying
          ? "Verify your email"
          : isLogin
          ? "Sign in to CogniFlow"
          : "Create your account"}
      </h1>

      <p className="text-center text-[14px] text-[var(--text-secondary)] mt-1 mb-6">
        {isVerifying
          ? "Enter the 6-digit code sent to your email"
          : isLogin
          ? "Welcome back. Enter your credentials to continue."
          : "Get started with team chat and CogniBot."}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && !isVerifying && (
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Username
            </label>
            <Input
              type="text"
              name="username"
              placeholder="e.g. shashank"
              value={form.username}
              onChange={handleChange}
              disabled={isProcessing}
              required
            />
          </div>
        )}

        {!isVerifying && (
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Email address
            </label>
            <Input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={isProcessing}
              required
            />
          </div>
        )}

        {!isVerifying && (
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                disabled={isProcessing}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {isVerifying && (
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Verification Code
            </label>
            <Input
              type="text"
              name="otp"
              placeholder="Enter 6-digit OTP"
              value={form.otp}
              onChange={handleChange}
              disabled={isProcessing}
              maxLength={6}
              required
              className="text-center tracking-widest font-mono text-base"
            />
            <div className="text-right mt-1.5">
              <span
                onClick={onResendClick}
                className={`text-[13px] font-medium transition-colors ${
                  timeLeft > 0 || isProcessing
                    ? "text-[var(--text-tertiary)] cursor-not-allowed"
                    : "text-[var(--accent)] cursor-pointer hover:underline"
                }`}
              >
                {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : "Resend OTP?"}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isProcessing}
          className="mt-2"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Please wait...</span>
            </span>
          ) : isVerifying ? (
            "Verify code"
          ) : isLogin ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {/* Demo accounts (Section 4.2 quiet secondary option) */}
      {isLogin && !isVerifying && (
        <div className="mt-6">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-full border-t border-[var(--border)]"></div>
            <span className="absolute px-3 bg-[var(--bg-panel)] text-[12px] text-[var(--text-tertiary)]">
              or
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-[var(--text-secondary)] font-normal whitespace-nowrap">
              Try a demo account:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickDemoLogin && handleQuickDemoLogin("Demo1")}
                className="h-8 px-3 rounded-[8px] border border-[var(--border-strong)] text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer disabled:opacity-50"
              >
                Demo 1
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickDemoLogin && handleQuickDemoLogin("Demo2")}
                className="h-8 px-3 rounded-[8px] border border-[var(--border-strong)] text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer disabled:opacity-50"
              >
                Demo 2
              </button>
            </div>
          </div>

          <p className="text-center text-[12px] text-[var(--text-tertiary)] mt-2">
            Password: <code className="font-mono text-[var(--text-secondary)] select-all">DemoUser@123</code>
          </p>
        </div>
      )}

      {/* Switch auth mode */}
      <p className="text-center text-[14px] text-[var(--text-secondary)] mt-6 pt-4 border-t border-[var(--border)]">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          disabled={isProcessing}
          className="text-[var(--accent)] font-medium hover:underline cursor-pointer disabled:opacity-50"
          onClick={() => {
            if (isProcessing) return;
            setIsLogin(!isLogin);
            setIsVerifying(false);
          }}
        >
          {isLogin ? "Register" : "Sign in"}
        </button>
      </p>
    </div>
  );
};

export default AuthForm;