"""AI provider abstraction.

Talks to an OpenAI-compatible chat completions endpoint over HTTP (works with
OpenAI, Anthropic-compatible gateways, Ollama, LM Studio, OpenRouter, ...)
using httpx — no heavyweight SDK required.

`generate_json` always returns a parsed JSON object and raises AIServiceError
with a user-actionable message on every failure mode:
- no API key configured (AIServiceError with `not_configured=True`)
- provider/network errors
- responses that are not valid JSON
"""

import json
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings

settings = get_settings()

OPENROUTER_FREE_MODELS = (
    "nvidia/nemotron-3-super-120b-a12b:free",
    "dots-studio/dots-3-note-preview:free",
    "liquid/lfm-2.5-2.6b:free",
    "openrouter/free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
)


class AIServiceError(Exception):
    """Raised for any AI generation failure."""

    def __init__(self, message: str, not_configured: bool = False):
        super().__init__(message)
        self.not_configured = not_configured


def is_configured() -> bool:
    return bool(settings.ai_api_key.strip())


def _default_model() -> str:
    if settings.ai_model:
        return settings.ai_model
    return "gpt-4o-mini" if settings.ai_provider == "openai" else "claude-3-5-haiku-latest"


def _is_openrouter() -> bool:
    host = urlparse(settings.ai_base_url).hostname or ""
    return host == "openrouter.ai" or host.endswith(".openrouter.ai")


def _openrouter_models() -> list[str]:
    """Return a bounded list containing only catalog-verified free IDs."""
    configured = settings.ai_model
    primary = configured if configured in OPENROUTER_FREE_MODELS else OPENROUTER_FREE_MODELS[0]
    return [primary, *(model for model in OPENROUTER_FREE_MODELS if model != primary)]


def _extract_json(text: str) -> dict[str, Any]:
    """Parse JSON from a model response, tolerating markdown fences."""
    text = text.strip()
    if text.startswith("```"):
        # Strip ```json ... ``` fences if the model added them.
        text = text.split("```")[1] if "```" in text[3:] else text[3:]
        if text.startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise AIServiceError("AI returned a response that was not valid JSON.")
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError as exc:
        raise AIServiceError("AI returned a response that was not valid JSON.") from exc


def generate_json(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    """Send prompts to the configured provider and return parsed JSON.

    Raises AIServiceError (not_configured=True) when no API key is set.
    """
    if not is_configured():
        raise AIServiceError(
            "AI features are not configured. Add AI_API_KEY to the backend environment.",
            not_configured=True,
        )

    model = _default_model()

    if settings.ai_provider == "anthropic":
        headers = {
            "x-api-key": settings.ai_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        url = (settings.ai_base_url or "https://api.anthropic.com").rstrip("/")
        url += "/v1/messages"
        payload = {
            "model": model,
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }
    else:  # openai-compatible
        headers = {"Authorization": f"Bearer {settings.ai_api_key}"}
        base = (settings.ai_base_url or "https://api.openai.com/v1").rstrip("/")
        url = f"{base}/chat/completions"
        openrouter = _is_openrouter()
        models = _openrouter_models() if openrouter else [model]
        last_error: AIServiceError | None = None

        for index, current_model in enumerate(models):
            payload = {
                "model": current_model,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            }
            try:
                response = httpx.post(url, headers=headers, json=payload, timeout=90.0)
            except httpx.HTTPError as exc:
                last_error = AIServiceError("Could not reach the AI provider.")
                if openrouter and index + 1 < len(models):
                    continue
                raise last_error from exc

            if response.status_code != 200:
                if openrouter and response.status_code in (429, 500, 502, 503, 504):
                    last_error = AIServiceError(
                        "OpenRouter free models are temporarily busy or unavailable."
                    )
                    if index + 1 < len(models):
                        continue
                    raise AIServiceError(
                        "All configured OpenRouter free models are temporarily busy. Please try again shortly."
                    )
                raise AIServiceError(
                    f"AI provider could not complete the request (HTTP {response.status_code})."
                )

            try:
                body = response.json()
                content = body["choices"][0]["message"]["content"]
            except (ValueError, KeyError, IndexError, TypeError) as exc:
                last_error = AIServiceError("AI provider returned an unexpected response.")
                if openrouter and index + 1 < len(models):
                    continue
                raise last_error from exc

            try:
                return _extract_json(content)
            except AIServiceError as exc:
                last_error = exc
                if openrouter and index + 1 < len(models):
                    continue
                raise

        raise last_error or AIServiceError(
            "OpenRouter could not generate a valid response with its available free models. Please try again shortly."
        )

    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=90.0)
    except httpx.HTTPError as exc:
        raise AIServiceError("Could not reach the AI provider.") from exc

    if response.status_code != 200:
        raise AIServiceError(f"AI provider could not complete the request (HTTP {response.status_code}).")

    try:
        body = response.json()
    except ValueError as exc:
        raise AIServiceError("AI provider returned a non-JSON response.") from exc

    try:
        content = body["content"][0]["text"]
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("AI provider returned an unexpected response shape.") from exc

    return _extract_json(content)
