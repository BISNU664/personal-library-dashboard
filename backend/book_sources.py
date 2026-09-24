"""Book metadata from Apple Books and Open Library.

Apple Books (the iTunes Search API) has the most accurate search results and
sharp, current cover art, but no page counts. Open Library fills in page
counts, publication years, and covers for anything Apple doesn't sell.
Neither service needs an API key.
"""

import html
import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel


USER_AGENT = "PersonalLibraryDashboard/1.0"
TIMEOUT_SECONDS = 10

# Apple artwork URLs end in a size; "bb" keeps the aspect ratio within the box.
APPLE_COVER_SIZE = "600x600bb"

# Companion products that crowd out the real book in Apple search results.
NOT_THE_BOOK = re.compile(r"summary|study guide|analysis of|workbook", re.IGNORECASE)


class BookDetails(BaseModel):
    title: str
    author: str
    cover: str = ""
    pages: int = 0
    year: int | None = None


def _get_json(url: str, params: dict) -> dict:
    request = urllib.request.Request(
        f"{url}?{urllib.parse.urlencode(params)}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return json.load(response)


def normalise_title(text: str) -> str:
    """Lowercase, drop subtitles and alternate titles, and strip punctuation.

    "Frankenstein; or, The Modern Prometheus" and "Frankenstein" compare equal.
    """
    main_title = re.split(r"[:;(]", text)[0]
    return re.sub(r"[^a-z0-9 ]", "", main_title.casefold()).strip()


def work_key(title: str, author: str) -> str:
    """Identifies a book (not an edition) so readers' reviews can be shared.

    Uses the main title and the author's surname, so "Frankenstein; or, The
    Modern Prometheus" by "Mary Wollstonecraft Shelley" matches
    "Frankenstein" by "Mary Shelley".
    """
    surname = re.sub(r"[^a-z]", "", author.split()[-1].casefold()) if author.strip() else ""
    return f"{normalise_title(title)}|{surname}"


def _is_match(found_title: str, found_author: str, title: str, author: str) -> bool:
    surname = author.split()[-1].casefold() if author.strip() else ""
    return (
        normalise_title(found_title) == normalise_title(title)
        and surname in found_author.casefold()
    )


# ---------- Apple Books ----------


def _apple_items(term: str, limit: int) -> list[dict]:
    try:
        data = _get_json(
            "https://itunes.apple.com/search",
            {"term": term, "media": "ebook", "entity": "ebook", "limit": limit},
        )
    except (OSError, ValueError):
        return []

    return [
        item
        for item in data.get("results", [])
        if item.get("trackName") and not NOT_THE_BOOK.search(item["trackName"])
    ]


def _apple_cover(item: dict) -> str:
    return item.get("artworkUrl100", "").replace("100x100bb", APPLE_COVER_SIZE)


def _search_apple(term: str, limit: int) -> list[BookDetails]:
    return [
        BookDetails(
            title=item["trackName"],
            author=item.get("artistName", ""),
            cover=_apple_cover(item),
        )
        for item in _apple_items(term, limit)
    ]


# ---------- Open Library ----------


def open_library_search(params: dict) -> list[dict]:
    """Raw Open Library search results; raises OSError/ValueError on failure."""
    return _get_json("https://openlibrary.org/search.json", params).get("docs", [])



def _open_library_details(title: str, author: str) -> BookDetails:
    params = {
        "title": title,
        "limit": 1,
        "fields": "title,author_name,cover_i,number_of_pages_median,first_publish_year",
    }
    if author:
        params["author"] = author

    try:
        docs = _get_json("https://openlibrary.org/search.json", params).get("docs", [])
    except (OSError, ValueError):
        docs = []

    if not docs:
        return BookDetails(title=title, author=author)

    doc = docs[0]
    cover_id = doc.get("cover_i")

    return BookDetails(
        title=title,
        author=author,
        cover=f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else "",
        pages=doc.get("number_of_pages_median") or 0,
        year=doc.get("first_publish_year"),
    )


# ---------- Public API ----------


def find_book(title: str, author: str) -> BookDetails:
    """Cover, page count and year for a specific book."""
    with ThreadPoolExecutor(max_workers=2) as pool:
        apple_future = pool.submit(_search_apple, f"{title} {author}", 5)
        open_library_future = pool.submit(_open_library_details, title, author)

    details = open_library_future.result()

    # Apple search is fuzzy, so only trust a result that really is this book.
    apple_match = next(
        (
            book
            for book in apple_future.result()
            if _is_match(book.title, book.author, title, author)
        ),
        None,
    )

    if apple_match and apple_match.cover:
        details.cover = apple_match.cover

    return details


def search_books(query: str, limit: int = 6) -> list[BookDetails]:
    """Search results for the add-book form, best matches first."""
    # Apple can return more than asked for, especially after filtering.
    results = _search_apple(query, limit)[:limit]

    if not results:
        # Fall back to Open Library for books Apple doesn't sell.
        try:
            docs = _get_json(
                "https://openlibrary.org/search.json",
                {"q": query, "limit": limit, "fields": "title,author_name"},
            ).get("docs", [])
        except (OSError, ValueError):
            docs = []

        results = [
            BookDetails(title=doc["title"], author=(doc.get("author_name") or [""])[0])
            for doc in docs
            if doc.get("title")
        ]

    # Page counts and years only come from Open Library.
    with ThreadPoolExecutor(max_workers=limit) as pool:
        extras = list(
            pool.map(lambda book: _open_library_details(book.title, book.author), results)
        )

    for book, extra in zip(results, extras):
        book.pages = extra.pages
        book.year = extra.year
        book.cover = book.cover or extra.cover

    return results


# ---------- Book descriptions ----------


class BookInfo(BaseModel):
    """Extra details shown on a book's page."""

    description: str = ""
    genres: list[str] = []
    year: int | None = None
    reader_rating: float | None = None
    reader_rating_count: int = 0


_info_cache: dict[tuple[str, str], BookInfo] = {}


def _clean_description(raw: str) -> str:
    """Turn Apple's HTML blurb into plain text with paragraph breaks."""
    text = re.sub(r"<br\s*/?>|</p>", "\n", raw, flags=re.IGNORECASE)
    text = html.unescape(re.sub(r"<[^>]+>", "", text))
    text = re.sub(r"[ \t\xa0]+", " ", text)
    return re.sub(r"\n\s*\n+", "\n\n", text).strip()


def _open_library_description(title: str, author: str) -> str:
    try:
        docs = open_library_search({"title": title, "author": author, "limit": 1, "fields": "key"})
        if not docs:
            return ""
        work = _get_json(f"https://openlibrary.org{docs[0]['key']}.json", {})
    except (OSError, ValueError, KeyError):
        return ""

    description = work.get("description", "")
    if isinstance(description, dict):
        description = description.get("value", "")
    return description.strip()


def describe_book(title: str, author: str) -> BookInfo:
    """Description, genres, first-published year and reader rating for a book."""
    key = (normalise_title(title), author.casefold())
    if key in _info_cache:
        return _info_cache[key]

    with ThreadPoolExecutor(max_workers=2) as pool:
        apple_future = pool.submit(_apple_items, f"{title} {author}", 5)
        open_library_future = pool.submit(_open_library_details, title, author)

    item = next(
        (
            item
            for item in apple_future.result()
            if _is_match(item["trackName"], item.get("artistName", ""), title, author)
        ),
        None,
    )

    info = BookInfo(year=open_library_future.result().year)

    if item:
        info.description = _clean_description(item.get("description", ""))
        info.genres = [genre for genre in item.get("genres", []) if genre != "Books"][:5]
        if item.get("userRatingCount"):
            info.reader_rating = item.get("averageUserRating")
            info.reader_rating_count = item["userRatingCount"]

    if not info.description:
        info.description = _open_library_description(title, author)

    # Only cache real results, so a network blip doesn't stick for the session.
    if info.description or info.genres:
        _info_cache[key] = info

    return info
