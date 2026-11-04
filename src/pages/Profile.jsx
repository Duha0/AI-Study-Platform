import { useState } from "react";
import { usersApi } from "../lib/api";
import { STUDY_LEVELS } from "../lib/storage";
import { t, setLang } from "../lib/i18n";

// Profile & Settings. Account fields (name, study info) are read from and
// written to the backend via the API layer. Theme is a UI-only preference
// owned by App.jsx state (persisted in lib/storage). Logout flows through
// App.jsx so both the sidebar and this page behave identically.

function Profile({ user, theme, onSetTheme, onLogout, onProfileUpdated, lang, onLangChange, interfaceLanguage, aiContentLanguage }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [studying, setStudying] = useState(user?.studying || "");
  const [level, setLevel] = useState(user?.study_level || STUDY_LEVELS[0]);
  const [interfaceLang, setInterfaceLang] = useState(interfaceLanguage || "en");
  const [aiContentLang, setAIContentLang] = useState(aiContentLanguage || "en");
  const [feedback, setFeedback] = useState(null); // { type: "error" | "success", text }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = user?.email || "";

  async function handleSubmit(event) {
    event.preventDefault();

    if (!fullName.trim()) {
      setFeedback({ type: "error", text: t("profile.full_name_cant_be_empty") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const updatedUser = await usersApi.updateProfile(
        fullName.trim(),
        studying.trim(),
        level,
        interfaceLang,
        aiContentLang
      );
      onProfileUpdated(updatedUser);
      setFeedback({ type: "success", text: t("profile.changes_saved") });
      // Apply interface language immediately if changed
      if (interfaceLang !== lang) {
        setLang(interfaceLang);
        onLangChange(interfaceLang);
      }
    } catch (apiError) {
      setFeedback({
        type: "error",
        text: apiError.message || t("profile.could_not_save_changes"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="welcome">
        <div>
          <h1 className="welcome-title">{t("profile.profile_settings")}</h1>
          <p className="welcome-subtitle">
            {t("profile.manage_your_account")}
          </p>
        </div>
      </header>

      <section className="section" id="profile-section">
        <h2 className="section-title">{t("profile.profile")}</h2>

        {feedback && (
          <p className={feedback.type === "error" ? "form-error" : "form-success"}>
            {feedback.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="field">
            <label htmlFor="profile-name">{t("profile.full_name")}</label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="profile-email">{t("profile.email")}</label>
            <input id="profile-email" type="email" value={email} disabled />
          </div>

          <div className="field">
            <label htmlFor="profile-level">{t("profile.study_level")}</label>
            <select
              id="profile-level"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              {STUDY_LEVELS.map((studyLevel) => (
                <option key={studyLevel} value={studyLevel}>
                  {studyLevel}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="profile-studying">{t("profile.what_are_you_studying")}</label>
            <input
              id="profile-studying"
              type="text"
              value={studying}
              onChange={(event) => setStudying(event.target.value)}
              placeholder={t("onboarding.subject_placeholder")}
            />
          </div>

          <button type="submit" className="button-primary" disabled={isSubmitting}>
            {isSubmitting ? t("profile.saving") : t("profile.save_changes")}
          </button>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">{t("profile.settings")}</h2>

        <h3 className="settings-subheading">{t("profile.appearance")}</h3>
        <div className="settings-actions">
          <button
            type="button"
            className={theme === "light" ? "button-primary" : "button-secondary"}
            onClick={() => onSetTheme("light")}
          >
            {t("profile.light_mode")}
          </button>
          <button
            type="button"
            className={theme === "dark" ? "button-primary" : "button-secondary"}
            onClick={() => onSetTheme("dark")}
          >
            {t("profile.dark_mode")}
          </button>
        </div>

        <h3 className="settings-subheading">{t("profile.language")}</h3>
        <p className="settings-desc">{t("profile.language_desc")}</p>
        <div className="settings-actions">
          <button
            type="button"
            className={interfaceLang === "en" ? "button-primary" : "button-secondary"}
            onClick={() => {
              setInterfaceLang("en");
              setLang("en");
            }}
          >
            {t("profile.english")}
          </button>
          <button
            type="button"
            className={interfaceLang === "ar" ? "button-primary" : "button-secondary"}
            onClick={() => {
              setInterfaceLang("ar");
              setLang("ar");
            }}
          >
            {t("profile.arabic")}
          </button>
        </div>

        <h3 className="settings-subheading">{t("profile.ai_content_language")}</h3>
        <p className="settings-desc">{t("profile.ai_content_language_desc")}</p>
        <div className="settings-actions">
          <button
            type="button"
            className={aiContentLang === "en" ? "button-primary" : "button-secondary"}
            onClick={() => setAIContentLang("en")}
          >
            {t("profile.english")}
          </button>
          <button
            type="button"
            className={aiContentLang === "ar" ? "button-primary" : "button-secondary"}
            onClick={() => setAIContentLang("ar")}
          >
            {t("profile.arabic")}
          </button>
        </div>

        <h3 className="settings-subheading">{t("profile.account")}</h3>
        <div className="settings-actions">
          <a href="#profile-section" className="link-button">
            {t("profile.profile")}
          </a>
          <button type="button" className="button-secondary" onClick={onLogout}>
            {t("profile.logout")}
          </button>
        </div>
      </section>
    </>
  );
}

export default Profile;
