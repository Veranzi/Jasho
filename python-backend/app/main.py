from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.sessions import SessionMiddleware
from .config import settings
from fastapi.staticfiles import StaticFiles


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret)

    # Routers will be included below to match Flutter ApiService endpoints
    from .routers import auth, user, wallet, ai, heatmap, chatbot, credit_score, gamification, savings, profile_image, cybersecurity
    from .routers import jobs

    app.include_router(auth.router, prefix=settings.api_prefix + "/auth", tags=["auth"])
    app.include_router(user.router, prefix=settings.api_prefix + "/user", tags=["user"])
    app.include_router(wallet.router, prefix=settings.api_prefix + "/wallet", tags=["wallet"])
    app.include_router(ai.router, prefix=settings.api_prefix + "/ai", tags=["ai"])
    app.include_router(heatmap.router, prefix=settings.api_prefix + "/heatmap", tags=["heatmap"])
    app.include_router(chatbot.router, prefix=settings.api_prefix + "/chatbot", tags=["chatbot"])
    app.include_router(credit_score.router, prefix=settings.api_prefix + "/credit-score", tags=["credit-score"])
    app.include_router(gamification.router, prefix=settings.api_prefix + "/gamification", tags=["gamification"])
    app.include_router(savings.router, prefix=settings.api_prefix + "/savings", tags=["savings"])
    app.include_router(profile_image.router, prefix=settings.api_prefix + "/profile-image", tags=["profile-image"])
    app.include_router(cybersecurity.router, prefix=settings.api_prefix + "/cybersecurity", tags=["cybersecurity"])
    app.include_router(jobs.router, prefix=settings.api_prefix + "/jobs", tags=["jobs"])

    # Static files for uploaded profile images
    app.mount(
        "/uploads/profile-images",
        StaticFiles(directory=str(settings.uploads_dir)),
        name="profile-images",
    )

    @app.get("/health")
    def health():
        return {"status": "running"}

    return app


app = create_app()
