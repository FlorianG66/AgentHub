import re
import unicodedata

from sqlalchemy import select


def slugify(value: str) -> str:
    """Transforme 'Boulangerie Artisanale & Co' -> 'boulangerie-artisanale-co'."""
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "espace"


async def unique_slug(db, model, base_slug: str) -> str:
    """Retourne un slug unique pour le modèle donné ('mon-espace', 'mon-espace-2', ...)."""
    slug = base_slug
    counter = 2
    while True:
        exists = (await db.execute(
            select(model).where(model.slug == slug)
        )).scalar_one_or_none()
        if not exists:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1