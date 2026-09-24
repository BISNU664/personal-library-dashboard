"""Free book recommendations from Open Library - no API key or AI needed.

Builds a taste profile from the subjects and authors of the books you rate
highly, then ranks popular Open Library books that share those subjects.
Picks are less nuanced than Claude's, but cost nothing.
"""

import math
import re
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

import book_sources
import models
from schemas import SuggestedBook


MAX_TASTE_BOOKS = 6
MAX_SUBJECTS = 6
SUBJECTS_PER_BOOK = 4
MAX_PER_AUTHOR = 2

UNRATED_WEIGHT = 3.5
TO_READ_WEIGHT = 2.0

# Subjects too broad (or too bibliographic) to say anything about taste.
GENERIC_SUBJECTS = {
    "fiction", "fiction, general", "general", "novel", "novels", "literature",
    "english literature", "american literature", "accessible book",
    "protected daisy", "in library", "large type books", "young adult",
    "juvenile fiction", "juvenile literature", "adventure", "open library staff picks",
    "long now manual for civilization", "reading level-grade 11",
    "reading level-grade 12", "nyt:hardcover-fiction", "new york times bestseller",
    "american english", "amerikanisches englisch", "english language",
    "translations into english", "readers", "large print", "fiction, action & adventure",
}

# (keywords found in a book's subjects, broad genre label), checked in order.
GENRE_RULES = [
    (("science fiction", "dystopia", "space", "time travel", "cyberpunk"), "Science Fiction"),
    (("fantasy", "magic", "dragons", "wizards"), "Fantasy"),
    (("horror", "ghost", "vampire", "zombie"), "Horror"),
    (("thriller", "suspense", "psychological fiction", "serial murder"), "Thriller"),
    (("mystery", "detective", "crime"), "Mystery"),
    (("romance", "love stories"), "Romance"),
    (("historical fiction",), "Historical Fiction"),
    (("biography", "memoir", "self-help", "business", "popular science", "essays"), "Non-fiction"),
    (("classics", "classic literature"), "Classics"),
]

# Used when the library is empty: well-loved books across a range of genres.
STARTER_SUBJECTS = [
    "fantasy", "science fiction", "mystery", "thriller",
    "historical fiction", "classic literature",
]


def _clean_subject(subject: str) -> str | None:
    """Normalise an Open Library subject, or None if it says nothing useful."""
    subject = subject.strip()

    # Tagged subjects such as "genre:science fiction" keep their value;
    # series/franchise/form tags would only recommend the same series.
    if ":" in subject:
        tag, _, value = subject.partition(":")
        if tag != "genre":
            return None
        subject = value

    subject = subject.lower()
    if subject in GENERIC_SUBJECTS or len(subject) < 4 or re.search(r"\d", subject):
        return None

    # Character and place subjects ("frankenstein (fictitious character)")
    # only surface spin-offs of the same story.
    if "(" in subject:
        return None

    return subject


def _genre_for(subjects: list[str], first_published: int | None) -> str:
    """The broad genre whose keywords appear in the most subjects."""
    lowered = [subject.lower() for subject in subjects]
    best_genre, best_hits = None, 0

    for keywords, genre in GENRE_RULES:
        hits = sum(any(keyword in subject for keyword in keywords) for subject in lowered)
        if hits > best_hits:
            best_genre, best_hits = genre, hits

    if best_genre:
        return best_genre
    if first_published and first_published < 1930:
        return "Classics"
    return "Literary Fiction"


def _taste_weight(book: models.Book) -> float:
    if book.rating:
        return float(book.rating)
    return TO_READ_WEIGHT if book.status == "To Read" else UNRATED_WEIGHT


def _search(params: dict) -> list[dict]:
    fields = "title,author_name,subject,ratings_average,ratings_count,first_publish_year"
    try:
        return book_sources.open_library_search({**params, "fields": fields})
    except (OSError, ValueError):
        return []


def _book_subjects(book: models.Book) -> list[str]:
    docs = _search({"title": book.title, "author": book.author, "limit": 1})
    if not docs:
        return []

    cleaned = [_clean_subject(subject) for subject in docs[0].get("subject", [])]
    return [subject for subject in cleaned if subject][:SUBJECTS_PER_BOOK]


def _starter_picks(count: int, excluded: set[str]) -> list[SuggestedBook]:
    per_subject = math.ceil(count / len(STARTER_SUBJECTS)) + 1

    with ThreadPoolExecutor(max_workers=len(STARTER_SUBJECTS)) as pool:
        results = list(pool.map(
            lambda subject: _search({"q": f'subject:"{subject}"', "sort": "readinglog", "limit": 10}),
            STARTER_SUBJECTS,
        ))

    picks = []
    for subject, docs in zip(STARTER_SUBJECTS, results):
        added = 0
        for doc in docs:
            title, authors = doc.get("title"), doc.get("author_name")
            if not title or not authors or book_sources.normalise_title(title) in excluded:
                continue

            genre = _genre_for(
                doc.get("subject", [])[:15] + [subject], doc.get("first_publish_year")
            )
            picks.append(SuggestedBook(
                title=title,
                author=authors[0],
                genre=genre,
                reason=(
                    f"A reader favourite in {genre.lower()}. Add and rate books in "
                    "your library to get picks tailored to your taste."
                ),
            ))
            excluded.add(book_sources.normalise_title(title))
            added += 1
            if added == per_subject:
                break

    return picks[:count]


def _make_suggestion(
    doc: dict,
    shared: list[str],
    same_author: models.Book | None,
    subject_source: dict[str, models.Book],
) -> SuggestedBook:
    author = doc["author_name"][0]

    if same_author:
        reason = f"More from {author}, who wrote {same_author.title}"
        reason += f", which you rated {same_author.rating}/6." if same_author.rating else "."
    else:
        source = subject_source[shared[0]]
        reason = f"Because you liked {source.title}: another {shared[0]} book"
        if len(shared) > 1:
            reason += f" that also touches on {shared[1]}"
        reason += "."

    average = doc.get("ratings_average")
    if average and (doc.get("ratings_count") or 0) >= 10:
        reason += f" Open Library readers rate it {average:.1f}/5."

    return SuggestedBook(
        title=doc["title"],
        author=author,
        genre=_genre_for(shared + doc.get("subject", [])[:15], doc.get("first_publish_year")),
        reason=reason,
    )


def suggest(
    books: list[models.Book],
    dismissed_titles: list[str],
    count: int,
) -> list[SuggestedBook]:
    excluded = {book_sources.normalise_title(title) for title in dismissed_titles}
    excluded |= {book_sources.normalise_title(book.title) for book in books}

    # Books rated 1-2 are dislikes: don't build on them, and skip their authors.
    liked = [book for book in books if not (0 < book.rating <= 2)]
    disliked_authors = {book.author.casefold() for book in books if 0 < book.rating <= 2}

    taste_books = sorted(liked, key=_taste_weight, reverse=True)[:MAX_TASTE_BOOKS]
    if not taste_books:
        return _starter_picks(count, excluded)

    with ThreadPoolExecutor(max_workers=MAX_TASTE_BOOKS) as pool:
        book_subjects = list(pool.map(_book_subjects, taste_books))

    # subject -> total weight, and the favourite book it came from (for reasons)
    subject_weight: dict[str, float] = defaultdict(float)
    subject_source: dict[str, models.Book] = {}
    for book, subjects in zip(taste_books, book_subjects):
        for subject in subjects:
            subject_weight[subject] += _taste_weight(book)
            source = subject_source.get(subject)
            if source is None or _taste_weight(book) > _taste_weight(source):
                subject_source[subject] = book

    top_subjects = sorted(subject_weight, key=subject_weight.get, reverse=True)[:MAX_SUBJECTS]
    author_books = {book.author.casefold(): book for book in taste_books}

    queries = [{"q": f'subject:"{subject}"', "sort": "readinglog", "limit": 25} for subject in top_subjects]
    queries += [{"author": book.author, "sort": "readinglog", "limit": 8} for book in taste_books]

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(_search, queries))

    owned_titles = [
        book_sources.normalise_title(book.title)
        for book in books
        if len(book_sources.normalise_title(book.title)) >= 5
    ]

    candidates: dict[str, dict] = {}
    for docs in results:
        for doc in docs:
            key = book_sources.normalise_title(doc.get("title", ""))
            if not doc.get("title") or not doc.get("author_name") or key in excluded:
                continue
            # Skip omnibuses, annotated editions and the like of books you own.
            if any(owned in key for owned in owned_titles):
                continue
            candidates.setdefault(key, doc)

    scored = []
    for doc in candidates.values():
        author = doc["author_name"][0]
        if author.casefold() in disliked_authors:
            continue

        subjects = {s for s in map(_clean_subject, doc.get("subject", [])) if s}
        shared = [s for s in top_subjects if s in subjects]
        same_author = author_books.get(author.casefold())

        score = sum(subject_weight[s] for s in shared)
        if same_author:
            score += _taste_weight(same_author) * 0.8

        ratings = doc.get("ratings_count") or 0
        score += math.log10(ratings + 1)
        if ratings >= 10:
            score += ((doc.get("ratings_average") or 3.5) - 3.5) * 2

        if shared or same_author:
            scored.append((score, doc, shared, same_author))

    scored.sort(key=lambda item: item[0], reverse=True)

    # Spread picks across favourites so one prolific series doesn't dominate;
    # a second, uncapped pass fills any gaps.
    per_source_cap = max(3, math.ceil(count / len(taste_books)) + 1)
    picks: list[SuggestedBook] = []
    picked: set[str] = set()
    per_author: dict[str, int] = defaultdict(int)
    per_source: dict[str, int] = defaultdict(int)

    for capped in (True, False):
        for _, doc, shared, same_author in scored:
            if len(picks) == count:
                break

            author = doc["author_name"][0]
            key = book_sources.normalise_title(doc["title"])
            source = same_author or subject_source[shared[0]]

            if key in picked or per_author[author.casefold()] >= MAX_PER_AUTHOR:
                continue
            if capped and per_source[source.title] >= per_source_cap:
                continue

            picked.add(key)
            per_author[author.casefold()] += 1
            per_source[source.title] += 1
            picks.append(_make_suggestion(doc, shared, same_author, subject_source))

    # Top up with popular picks if the library didn't give enough matches.
    if len(picks) < count:
        excluded |= {book_sources.normalise_title(pick.title) for pick in picks}
        picks += _starter_picks(count - len(picks), excluded)

    return picks
