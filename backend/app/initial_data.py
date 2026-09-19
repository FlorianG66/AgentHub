from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant
from app.models.agent import Agent
from app.models.knowledge import KnowledgeDoc
from app.models.user import User
from app.core.security import hash_password

async def init_db_data(db: AsyncSession):
    """Initialise les entreprises tests, l'équipe d'agents par défaut et les comptes utilisateurs."""
    tenant_res = await db.execute(select(Tenant))
    if tenant_res.scalars().first():
        await ensure_seed_users(db)
        return  # Base déjà initialisée

    # 1. Création de l'unique entreprise initiale (Tenant)
    t1 = Tenant(
        id="tenant-boulangerie",
        name="Boulangerie Artisanale & Co",
        slug="boulangerie-artisanale",
        plan="pro",
        settings={"primary_color": "#D97706", "sector": "Artisanat / Métiers de bouche"}
    )
    db.add(t1)
    await db.flush()

    # 2. Équipe d'Agents Humanisés pour la Boulangerie
    agents = [
        Agent(
            id="agent-lea",
            tenant_id="tenant-boulangerie",
            name="Léa",
            role="Community Manager",
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            bio="Passionnée de réseaux sociaux et d'artisanat. Fait rayonner nos produits locaux sur LinkedIn et Instagram.",
            capabilities=["social_media", "planning", "copywriting", "community_management"],
            system_prompt=(
                "Tu es Léa, Community Manager de la Boulangerie Artisanale & Co. "
                "Ton ton est chaleureux, authentique et valorise le fait-maison. "
                "Tu travailles main dans la main avec tes collègues (Marc pour les statistiques, Sophie pour les textes longs)."
            ),
            status="available"
        ),
        Agent(
            id="agent-marc",
            tenant_id="tenant-boulangerie",
            name="Marc",
            role="Analyste de Données",
            avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            bio="Spécialiste de la performance et de l'audience. Transforme les chiffres en plans d'action concrets.",
            capabilities=["data_analysis", "analytics", "reporting", "insights"],
            system_prompt=(
                "Tu es Marc, Analyste de données. Tu apportes des constats clairs et chiffrés. "
                "Tu identifies ce qui a fonctionné et recommandes 2 à 3 points d'amélioration stratégiques."
            ),
            status="available"
        ),
        Agent(
            id="agent-sophie",
            tenant_id="tenant-boulangerie",
            name="Sophie",
            role="Rédactrice & Storyteller",
            avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            bio="Raconte l'histoire des produits et de nos artisans avec des mots justes et captivants.",
            capabilities=["copywriting", "seo", "storytelling", "newsletter"],
            system_prompt=(
                "Tu es Sophie, Rédactrice créative. Tu aimes raconter les coulisses du métier d'artisan avec émotion et clarté."
            ),
            status="available"
        ),
        Agent(
            id="agent-thomas",
            tenant_id="tenant-boulangerie",
            name="Thomas",
            role="Assistant RH & Organisation",
            avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            bio="Structure les recrutements, la rédaction de fiches de poste et la veille sociale.",
            capabilities=["recruitment", "contracts", "onboarding", "admin"],
            system_prompt=(
                "Tu es Thomas, Assistant RH. Tu rédiges les fiches de postes et prépares les plannings et contrats dans le respect des règles."
            ),
            status="available"
        )
    ]
    db.add_all(agents)

    # 3. Base de connaissances par défaut (RAG)
    docs = [
        KnowledgeDoc(
            id="doc-charte",
            tenant_id="tenant-boulangerie",
            title="Charte Éditoriale & Identité",
            category="charte_editoriale",
            content=(
                "Boulangerie Artisanale & Co fondée en 2018.\n"
                "Engagements : Farines 100% locales et bio de notre région, levain naturel élevé chaque jour, aucun produit congelé.\n"
                "Ton de communication : Chaleureux, humble mais fier de l'artisanat français.\n"
                "Règle clé sur les réseaux : Toujours terminer par une question pour engager la communauté."
            )
        ),
        KnowledgeDoc(
            id="doc-produits",
            tenant_id="tenant-boulangerie",
            title="Catalogue & Horaires",
            category="produits",
            content=(
                "Ouverture : Mardi au Dimanche de 6h30 à 19h30 (fermé le lundi).\n"
                "Spécialités : Pain au Levain Rustique (1,40€), Baguette Tradition Label Rouge (1,30€), Flan à la vanille de Madagascar (3,20€).\n"
                "Nouveauté de saison : Tartelette poire-chocolat maison."
            )
        )
    ]
    db.add_all(docs)

    await ensure_seed_users(db)
    await db.commit()


async def ensure_seed_users(db: AsyncSession):
    """Crée les comptes de démonstration (super-admin + admin du tenant) s'ils n'existent pas encore."""
    existing = await db.execute(select(User.email))
    emails = {r[0] for r in existing.all()}

    users = []
    if "admin@agenthub.local" not in emails:
        users.append(User(
            id="user-admin",
            tenant_id=None,
            email="admin@agenthub.local",
            full_name="Super Admin Plateforme",
            hashed_password=hash_password("admin123"),
            role="super_admin",
        ))
    if "contact@boulangerie.com" not in emails:
        users.append(User(
            id="user-boulangerie",
            tenant_id="tenant-boulangerie",
            email="contact@boulangerie.com",
            full_name="Morgan (Gérante)",
            hashed_password=hash_password("client123"),
            role="client_admin",
        ))

    if users:
        db.add_all(users)
        await db.commit()