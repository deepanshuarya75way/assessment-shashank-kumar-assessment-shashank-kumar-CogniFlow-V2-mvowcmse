import React, { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import AuthForm from "../components/auth/AuthForm";
import { getBackendUrl } from "../utils/apiConfig";
import { setAuthSession } from "../utils/authStorage";

export const DEMO_CREDENTIALS = {
  Demo1: {
    username: "Demo1",
    email: "demo1@cogniflow.com",
    password: "DemoUser@123",
  },
  Demo2: {
    username: "Demo2",
    email: "demo2@cogniflow.com",
    password: "DemoUser@123",
  },
};

const AuthPage = () => {
  const navigate = useNavigate();
  const BackendUrl = getBackendUrl();

  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeToastRef = useRef(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    otp: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFillDemo = (demoKey) => {
    const creds = DEMO_CREDENTIALS[demoKey];
    if (!creds) return;
    setForm((prev) => ({
      ...prev,
      email: creds.email,
      password: creds.password,
    }));
    toast.success(`Loaded ${demoKey} credentials!`, { duration: 2500 });
  };

  const handleQuickDemoLogin = async (demoKey) => {
    if (isProcessing) return;
    const creds = DEMO_CREDENTIALS[demoKey];
    if (!creds) return;

    setForm((prev) => ({
      ...prev,
      email: creds.email,
      password: creds.password,
    }));

    setIsProcessing(true);
    if (activeToastRef.current) {
      toast.dismiss(activeToastRef.current);
    }
    const toastId = toast.loading(`Logging in as ${demoKey}...`);
    activeToastRef.current = toastId;

    try {
      const { data } = await axios.post(`${BackendUrl}/api/auth/login`, {
        email: creds.email,
        password: creds.password,
      });

      setAuthSession(data.token, data.user.id);

      toast.success(`Logged in as ${data.user.username}!`, { id: toastId });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || `Demo login failed`, {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard against multiple rapid clicks while already processing
    if (isProcessing) return;

    setIsProcessing(true);
    if (activeToastRef.current) {
      toast.dismiss(activeToastRef.current);
    }
    const toastId = toast.loading(
      isVerifying ? "Verifying OTP..." : isLogin ? "Logging in..." : "Creating account..."
    );
    activeToastRef.current = toastId;

    try {
      if (isVerifying) {
        await axios.post(`${BackendUrl}/api/auth/verify-email`, {
          email: form.email,
          otp: form.otp,
        });

        toast.success("Email Verified! You can now log in.", { id: toastId });
        setIsVerifying(false);
        setIsLogin(true);
        return;
      }

      const url = isLogin
        ? `${BackendUrl}/api/auth/login`
        : `${BackendUrl}/api/auth/register`;

      const { data } = await axios.post(url, form);

      if (isLogin) {
        setAuthSession(data.token, data.user.id);

        toast.success("Login Successful!", { id: toastId });
        navigate("/dashboard", { replace: true });
      } else {
        setIsVerifying(true);
        toast.success("OTP Sent to your email!", { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendOTP = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    if (activeToastRef.current) {
      toast.dismiss(activeToastRef.current);
    }
    const toastId = toast.loading("Resending OTP...");
    activeToastRef.current = toastId;

    try {
      await axios.post(`${BackendUrl}/api/auth/register`, {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      toast.success("A new OTP has been sent!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <div className="w-full max-w-[400px]">
        <Card className="p-6 sm:p-8">
          <AuthForm
            isLogin={isLogin}
            isVerifying={isVerifying}
            isProcessing={isProcessing}
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setIsLogin={setIsLogin}
            setIsVerifying={setIsVerifying}
            handleResendOTP={handleResendOTP}
            handleFillDemo={handleFillDemo}
            handleQuickDemoLogin={handleQuickDemoLogin}
          />
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
