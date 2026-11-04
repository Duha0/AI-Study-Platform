"""Prompts for the AI service.

Each builder returns (system_prompt, user_prompt) and pins the exact JSON
shape the caller expects — the provider is asked for JSON only, and the
result is validated with Pydantic before anything is stored.

The `language` parameter ("en" | "ar") instructs the model to generate
content in that interface language.
"""

SUMMARY_SYSTEM_EN = (
    "You are a study assistant that creates clear, accurate study summaries. "
    "Respond with valid JSON only — no prose outside the JSON."
)

SUMMARY_SYSTEM_AR = (
    "أنت مساعد دراسي ينشئ ملخصات دراسية واضحة ودقيقة. "
    "استجب بصيغة JSON صالحة فقط — لا نصوص خارج JSON."
)

QUIZ_SYSTEM_EN = (
    "You are a study assistant that writes fair multiple-choice quizzes that "
    "test real understanding of the source material. Respond with valid JSON "
    "only — no prose outside the JSON."
)

QUIZ_SYSTEM_AR = (
    "أنت مساعد دراسي يكتب اختبارات متعددة الخيارات عادلة تختبر الفهم الفعلي "
    "لمادة المصدر. استجب بصيغة JSON صالحة فقط — لا نصوص خارج JSON."
)

FLASHCARDS_SYSTEM_EN = (
    "You are a study assistant that creates effective flashcards. Each card "
    "tests one atomic fact or concept. Respond with valid JSON only — no "
    "prose outside the JSON."
)

FLASHCARDS_SYSTEM_AR = (
    "أنت مساعد تنشئ بطاقات تعليمية فعالة. كل بطاقة تختبر حقيقة أو مفهوم واحد. "
    "استجب بصيغة JSON صالحة فقط — لا نصوص خارج JSON."
)

_TEXT_LIMIT = 24_000  # characters of source text sent to the model


def _clip(text: str) -> str:
    return text[:_TEXT_LIMIT]


def _system(language: str, en: str, ar: str) -> str:
    return ar if language == "ar" else en


def build_summary_prompt(text: str, language: str = "en") -> tuple[str, str]:
    user = f"""Study material:

{_clip(text)}

Create a study summary of this material.
Return JSON exactly in this shape:
{{
  "intro": "a 2-3 sentence overview of what the material covers",
  "points": ["a key takeaway worth remembering", "..."]
}}
Rules:
- 5 to 8 points.
- Each point is one self-contained sentence a student can revise from.
- Base every point strictly on the material; do not invent facts.
- Write all output text in {"Arabic" if language == "ar" else "English"}."""
    return _system(language, SUMMARY_SYSTEM_EN, SUMMARY_SYSTEM_AR), user


def build_quiz_prompt(text: str, num_questions: int = 5, language: str = "en") -> tuple[str, str]:
    user = f"""Study material:

{_clip(text)}

Write a {num_questions}-question multiple-choice quiz on the most important
ideas in this material.
Return JSON exactly in this shape:
{{
  "questions": [
    {{
      "prompt": "the question text",
      "options": ["option A text", "option B text", "option C text", "option D text"],
      "correct_index": 0,
      "explanation": "one sentence explaining why the correct answer is right"
    }}
  ]
}}
Rules:
- exactly {num_questions} questions.
- exactly 4 options per question.
- "correct_index" is the 0-based index of the correct option.
- wrong options must be plausible but clearly wrong on careful reading.
- Base every question strictly on the material; do not invent facts.
- Write all output text in {"Arabic" if language == "ar" else "English"}."""
    return _system(language, QUIZ_SYSTEM_EN, QUIZ_SYSTEM_AR), user


def build_flashcards_prompt(text: str, num_cards: int = 8, language: str = "en") -> tuple[str, str]:
    user = f"""Study material:

{_clip(text)}

Create {num_cards} flashcards covering the most testable facts and concepts
in this material.
Return JSON exactly in this shape:
{{
  "cards": [
    {{"front": "a question or term", "back": "the answer or definition"}}
  ]
}}
Rules:
- exactly {num_cards} cards.
- Each front tests ONE thing; each back answers it in one or two sentences.
- Base every card strictly on the material; do not invent facts.
- Write all output text in {"Arabic" if language == "ar" else "English"}."""
    return _system(language, FLASHCARDS_SYSTEM_EN, FLASHCARDS_SYSTEM_AR), user
