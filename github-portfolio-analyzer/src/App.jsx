import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportRef = useRef(null);

  const extractUsername = (url) => {
    if (!url) return "";
    if (url.includes("github.com")) {
      const parts = url.split("github.com/");
      return parts[1]?.replace("/", "") || "";
    }
    return url.trim();
  };

  const analyzeProfile = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const username = extractUsername(input);

      const userRes = await axios.get(
        `https://api.github.com/users/${username}`
      );

      const repoRes = await axios.get(
        `https://api.github.com/users/${username}/repos?per_page=100`
      );

      const user = userRes.data;
      const repos = repoRes.data || [];

      if (repos.length === 0) {
        alert("No public repositories found.");
        setLoading(false);
        return;
      }

      setProfile(user);

      const totalStars = repos.reduce(
        (sum, repo) => sum + (repo.stargazers_count || 0),
        0
      );

      const languages = new Set(
        repos.map((r) => r.language).filter(Boolean)
      );

      const documentedRepos = repos.filter(
        (r) => r.description && r.description.length > 10
      );

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const activeRepos = repos.filter(
        (r) => new Date(r.pushed_at) > ninetyDaysAgo
      );

      const accountAgeDays = Math.floor(
        (new Date() - new Date(user.created_at)) /
          (1000 * 60 * 60 * 24)
      );

      const documentationScore =
        (documentedRepos.length / repos.length) * 20;
      const activityScore = (activeRepos.length / repos.length) * 20;
      const impactScore = Math.min(20, totalStars / 5);
      const depthScore = Math.min(20, languages.size * 4);
      const structureScore = repos.length >= 5 ? 20 : 10;

      let totalScore =
        documentationScore +
        activityScore +
        impactScore +
        depthScore +
        structureScore;

      totalScore = Math.round(totalScore > 100 ? 100 : totalScore);

      const strengths = [];
      const redFlags = [];
      const recommendations = [];

      if (totalStars > 50) strengths.push("Strong community engagement.");
      if (languages.size >= 3) strengths.push("Good technical diversity.");
      if (activeRepos.length >= 3) strengths.push("Consistent recent activity.");
      if (!user.bio) redFlags.push("Missing professional bio.");
      if (activeRepos.length === 0) redFlags.push("No recent activity detected.");

      recommendations.push(
        "Add structured README with architecture explanation."
      );
      recommendations.push("Pin 3–4 strong projects.");
      recommendations.push("Maintain weekly commits.");

      const contributions = Array.from({ length: 52 * 7 }, () =>
        Math.floor(Math.random() * 5)
      );

      setResult({
        totalScore,
        breakdown: {
          Documentation: Math.round(documentationScore),
          Activity: Math.round(activityScore),
          Impact: Math.round(impactScore),
          TechnicalDepth: Math.round(depthScore),
          Structure: Math.round(structureScore),
        },
        strengths,
        redFlags,
        recommendations,
        stats: {
          totalRepos: repos.length,
          totalStars,
          languages: languages.size,
          activeRepos: activeRepos.length,
          followers: user.followers,
          accountAgeDays,
        },
        contributions,
      });
    } catch (error) {
      alert("Invalid GitHub username OR URL.",error);
    }

    setLoading(false);
  };

  

  

  return (
    <div className="app">
      <div className="header">
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="GitHub Logo"
          className="logo"
        />
        <h1>GitHub Portfolio Analyzer</h1>
      </div>

      
      <p>Recruiter-Focused Evaluation Tool</p>

      <div className="input-box">
        <input
          type="text"
          placeholder="Enter GitHub URL or Username"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={analyzeProfile}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {result && profile && (
        <div className="dashboard" ref={reportRef}>
          <div className="profile-card">
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="avatar"
            />
            <div>
              <h2>{profile.name || profile.login}</h2>
              <p>{profile.bio}</p>
              <a
                href={profile.html_url}
                target="_blank"
                rel="noreferrer"
              >
                View GitHub Profile
              </a>
            </div>
          </div>

          <h2>Portfolio Score: {result.totalScore}/100</h2>

          <div className="score-grid">
            {Object.entries(result.breakdown).map(([key, val]) => (
              <div key={key} className="score-card">
                <div className="circle">
                  <svg>
                    <circle cx="50" cy="50" r="45"></circle>
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      style={{ strokeDashoffset: 282 - (282 * val) / 100 }}
                    ></circle>
                  </svg>
                  <div className="percentage">{val}%</div>
                </div>
                <h4>{key}</h4>
              </div>
            ))}
          </div>

          <div className="contribution-graph">
            {result.contributions.map((val, i) => (
              <div
                key={i}
                className={`level-${val}`}
                title={`Contributions: ${val}`}
              ></div>
            ))}
          </div>

          <div className="stats-grid">
            <div>Total Repos: {result.stats.totalRepos}</div>
            <div>Total Stars: {result.stats.totalStars}</div>
            <div>Languages: {result.stats.languages}</div>
            <div>Active Repos (90d): {result.stats.activeRepos}</div>
            <div>Followers: {result.stats.followers}</div>
            <div>Account Age (Days): {result.stats.accountAgeDays}</div>
          </div>

          <div className="insights-section">
            <div className="insight-card">
              <h3>Strengths 💪</h3>
              <ul>
                {result.strengths.map((s, i) => (
                  <li key={i}>
                    <span className="emoji">✅</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="insight-card">
              <h3>Red Flags ⚠️</h3>
              <ul>
                {result.redFlags.map((r, i) => (
                  <li key={i}>
                    <span className="emoji">❌</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="insight-card">
              <h3>Actionable Recommendations 💡</h3>
              <ul>
                {result.recommendations.map((rec, i) => (
                  <li key={i}>
                    <span className="emoji">💡</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

         
        </div>
      )}
    </div>
  );
}
