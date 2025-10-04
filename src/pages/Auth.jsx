import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/auth.css";
import logo from "../assets/NotelyLogo.png";
import background from "../assets/Notelybackground.mp4";

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setAcceptTerms(false);
    setRememberMe(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      // Sign Up validation
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!");
        setIsLoading(false);
        return;
      }

      if (!acceptTerms) {
        alert("Please accept the terms and conditions");
        setIsLoading(false);
        return;
      }

      // Dummy signup function
      setTimeout(() => {
        alert(`Account created for: ${formData.email}`);
        setIsLoading(false);
        navigate("/dashboard");
      }, 1000);
    } else {
      // Sign In - dummy function
      setTimeout(() => {
        alert(`Signing in with: ${formData.email}`);
        setIsLoading(false);
        navigate("/dashboard");
      }, 1000);
    }
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Dummy Google auth
    setTimeout(() => {
      alert(
        `Google ${isSignUp ? "Sign Up" : "Sign In"} clicked! (Dummy function)`
      );
      setIsLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="auth-container">
      <video className="auth-background-video" autoPlay muted loop>
        <source src={background} type="video/mp4" />
      </video>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" onClick={handleBackToHome}>
            <img src={logo} alt="Notely Logo" className="auth-logo-image" />
            <span className="auth-logo-text">Notely</span>
          </div>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={`toggle-btn ${!isSignUp ? "active" : ""}`}
            onClick={() => !isSignUp || toggleMode()}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`toggle-btn ${isSignUp ? "active" : ""}`}
            onClick={() => isSignUp || toggleMode()}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-content">
          <h1 className="auth-title">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="auth-subtitle">
            {isSignUp
              ? "Join thousands of students taking smarter notes with AI"
              : "Sign in to your account to continue taking smart notes"}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your first name"
                    required={isSignUp}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your last name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder={
                  isSignUp ? "Create a password" : "Enter your password"
                }
                required
              />
              {isSignUp && (
                <p className="form-hint">Must be at least 8 characters long</p>
              )}
            </div>

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required={isSignUp}
                />
              </div>
            )}

            {isSignUp ? (
              <div className="form-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required={isSignUp}
                  />
                  <span className="checkbox-label">
                    I agree to the{" "}
                    <button type="button" className="link-button">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button type="button" className="link-button">
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>
            ) : (
              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-label">Remember me</span>
                </label>
                <button type="button" className="link-button">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary btn-full-width"
              disabled={isLoading}
            >
              {isLoading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          <div className="divider">
            <span className="divider-text">Or continue with</span>
          </div>

          <button
            onClick={handleGoogleAuth}
            className="btn-google"
            disabled={isLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="auth-footer">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={toggleMode} className="link-button">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
