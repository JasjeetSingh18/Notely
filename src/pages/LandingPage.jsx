import React from "react";
import { useNavigate } from "react-router-dom";
import "../landingPage.css";
import previewImg from "../assets/notely-app-preview.png";
import logo from "../assets/NotelyLogo.png";

const LandingPage = () => {
  const navigate = useNavigate();


  const handleGetStarted = () => {
    alert("Get Started clicked! This will redirect to sign up page.");
    // TODO: Navigate to sign up page
    // Example: navigate('/signup');
  };

  const handleLogin = () => {
    // Navigate to Documents page using React Router
    navigate("/dashboard");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <nav className="nav">
            <div className="logo">
              <img src={logo} alt="Notely Logo" className="logo-image" />
              Notely
            </div>
            <ul className="nav-links">
              <li>
                <button className="btn-secondary" onClick={handleLogin}>
                  Log In
                </button>
              </li>
              <li>
                <button className="btn-primary" onClick={handleGetStarted}>
                  Get Started For Free
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>
              Unlock Your{" "}
              <span className="hero-highlight">Academic Potential</span>
            </h1>
            <p className="hero-description">
              Your all-in-one note-taking app with an integrated AI tutor. Take
              smarter notes, ask questions in real-time, and master your
              subjects faster with personalized AI assistance.
            </p>
            <div className="email-form">
              <button onClick={handleGetStarted} className="btn-primary">
                Try it — it's FREE
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="demo-section">
        <div className="container">
          <div className="demo-card">
            <img
              src={previewImg}
              alt="Notely Dashboard Demo"
              className="demo-image"
            />
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>🧠</h3>
              <p>AI-Powered Insights</p>
            </div>
            <div className="stat-item">
              <h3>☁️</h3>
              <p>Seamless Note Sync</p>
            </div>
            <div className="stat-item">
              <h3>✨</h3>
              <p>Personalized Experience</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Take Smarter Notes with AI</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI That Understands You</h3>
              <p>
                As you write, our AI analyzes your notes in real-time to provide
                helpful insights and context.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Ask Questions Instantly</h3>
              <p>
                Type a question while taking notes and get accurate,
                AI-generated answers without leaving your page.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>Summarize Effortlessly</h3>
              <p>
                Turn long notes into concise summaries and key takeaways with a
                single click.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Stay Organized</h3>
              <p>
                Automatically categorize and tag your notes so you can easily
                find anything later.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Smart Suggestions</h3>
              <p>
                Get real-time ideas, definitions, and references based on what
                you’re writing.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Private and Secure</h3>
              <p>
                Your notes stay yours — encrypted and never shared without your
                consent.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to take notes?</h2>
          <button className="btn-primary" onClick={handleGetStarted}>
            Get Started for Free
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
