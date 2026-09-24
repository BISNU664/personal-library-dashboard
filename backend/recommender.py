"""Book recommendations: Claude when an API key is set, otherwise the free
Open Library-based recommender. Covers and page counts come from book_sources."""

import os
from concurrent.futures import ThreadPoolExecutor
from typing import Literal

import anthropic
from pydantic import BaseModel

import book_sources
import free_recommender
import models
from schemas import SuggestedBook


MODEL = "claude-opus-5"
RECOMMENDATION_COUNT = 12

SYSTEM_PROMPT = """You are a knowledgeable, well-read librarian recommending \
books to one reader based on their personal library.

Use their ratings (out of 6) and reading statuses as taste signals: lean \
towards what they rated highly, away from what they rated poorly, and treat \
unrated or "To Read" books as mild interest. Mix close matches with a few \
adventurous picks they might not find on their own.

Only recommend real, published books. Never recommend a book already in \
their library or one they have dismissed. Give each book one broad, common \
genre label (for example Fantasy, Science Fiction, Literary Fiction, Horror, \
Thriller, Classics, Historical Fiction, Non-fiction) so similar books share \
a label. Write each reason as one or two sentences addressed to the reader, \
referring to specific books in their library where it helps."""


class RecommendationError(Exception):
    """Raised when recommendations can't be generated; message is user-facing."""


class SuggestionList(BaseModel):
    books: list[SuggestedBook]


def _describe_book(book: models.Book) -> str:
    details = [book.status]
    if book.rating:
        details.append(f"rated {book.rating}/6")
    return f'- "{book.title}" by {book.author} ({", ".join(details)})'


def _build_prompt(books: list[models.Book], dismissed_titles: list[str]) -> str:
    if books:
        library = "\n".join(_describe_book(book) for book in books)
    else:
        library = "(Their library is empty - suggest widely loved books across a range of genres.)"

    prompt = (
        f"Here is my library:\n{library}\n\n"
        f"Recommend {RECOMMENDATION_COUNT} books I should read next."
    )

    if dismissed_titles:
        dismissed = "\n".join(f"- {title}" for title in dismissed_titles)
        prompt += f"\n\nI'm not interested in these, so don't suggest them:\n{dismissed}"

    return prompt


def _ask_claude(prompt: str) -> list[SuggestedBook]:
    try:
        client = anthropic.Anthropic()
        response = client.beta.messages.parse(
            model=MODEL,
            max_tokens=16000,
            thinking={"type": "adaptive"},
            output_config={"effort": "medium"},
            # If a request is ever declined by safety classifiers, retry it
            # on Anthropic's recommended fallback model instead of failing.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
            output_format=SuggestionList,
        )
    except TypeError as error:
        # Raised by the SDK when no credentials are configured.
        raise RecommendationError(
            "No Anthropic API key found. Add ANTHROPIC_API_KEY to backend/.env "
            "and restart the backend."
        ) from error
    except anthropic.BadRequestError as error:
        if "credit balance" in error.message.lower():
            raise RecommendationError(
                "Your Anthropic account has no credits. Add credits at "
                "console.anthropic.com, or remove ANTHROPIC_API_KEY from "
                "backend/.env to use the free recommender instead."
            ) from error
        raise RecommendationError(f"Claude API error: {error.message}") from error
    except anthropic.AuthenticationError as error:
        raise RecommendationError(
            "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in backend/.env."
        ) from error
    except anthropic.RateLimitError as error:
        raise RecommendationError(
            "Too many recommendation requests right now. Try again in a minute."
        ) from error
    except anthropic.APIStatusError as error:
        raise RecommendationError(f"Claude API error: {error.message}") from error
    except anthropic.APIConnectionError as error:
        raise RecommendationError(
            "Could not reach the Claude API. Check your internet connection."
        ) from error

    if response.stop_reason == "refusal" or response.parsed_output is None:
        raise RecommendationError("Claude couldn't generate recommendations. Please try again.")

    return response.parsed_output.books


Engine = Literal["claude", "free"]


def current_engine() -> Engine:
    """Claude when an API key is configured, otherwise the free recommender."""
    return "claude" if os.getenv("ANTHROPIC_API_KEY", "").strip() else "free"


def generate_recommendations(
    books: list[models.Book],
    dismissed_titles: list[str],
) -> list[models.Recommendation]:
    if current_engine() == "claude":
        suggestions = _ask_claude(_build_prompt(books, dismissed_titles))
    else:
        suggestions = free_recommender.suggest(books, dismissed_titles, RECOMMENDATION_COUNT)
        if not suggestions:
            raise RecommendationError(
                "Couldn't reach Open Library to find recommendations. Try again in a minute."
            )

    # Skip anything already owned, in case the model repeats a title.
    owned = {book.title.casefold() for book in books}
    suggestions = [s for s in suggestions if s.title.casefold() not in owned]

    with ThreadPoolExecutor(max_workers=6) as pool:
        details = list(
            pool.map(lambda s: book_sources.find_book(s.title, s.author), suggestions)
        )

    return [
        models.Recommendation(
            title=suggestion.title,
            author=suggestion.author,
            genre=suggestion.genre,
            reason=suggestion.reason,
            cover=detail.cover,
            pages=detail.pages,
        )
        for suggestion, detail in zip(suggestions, details)
    ]
