import json

from sqlalchemy import inspect, text
from sqlmodel import SQLModel, Session, create_engine, select
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)


def init_db():
    from app.models import SecretCode, SiteConfig

    secret_code_table_exists = inspect(engine).has_table("secret_code")
    SQLModel.metadata.create_all(engine)
    with engine.begin() as connection:
        columns = {
            column["name"] for column in inspect(connection).get_columns("project")
        }
        if "project_type" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE project ADD COLUMN project_type "
                    "VARCHAR(20) NOT NULL DEFAULT 'own'"
                )
            )

    with Session(engine) as session:
        if not secret_code_table_exists:
            session.add(
                SecretCode(
                    name="星港入口",
                    code="5201314",
                    description="进入星港工具子站",
                    target_type="internal",
                    target_url="/garden",
                )
            )

        profile_defaults = {
            "profile_name": ("树下树", "首页展示名称"),
            "profile_bio": ("乐乐来了", "首页个人介绍"),
            "profile_avatar": ("/images/lucy.jpg", "首页头像地址"),
        }
        for key, (value, description) in profile_defaults.items():
            exists = session.exec(
                select(SiteConfig).where(SiteConfig.key == key)
            ).first()
            if not exists:
                session.add(
                    SiteConfig(
                        key=key,
                        value=json.dumps(value, ensure_ascii=False),
                        description=description,
                    )
                )

        session.commit()


def get_session():
    with Session(engine) as session:
        yield session
