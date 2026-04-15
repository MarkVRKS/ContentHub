from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from typing import Optional, Dict, Any

# ----- модель контент плана -----
class ContentPlan(SQLModel, table=True):
    __tablename__ = "posts_plan_v3" # 🔥 ЧИТ-КОД: v3
    
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: str = Field(default="mns", index=True) 
    publish_date: str 
    topic: str = ""
    platforms: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

# ----- модель багажа идей -----
class Idea(SQLModel, table=True):
    __tablename__ = "project_ideas_v3"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: str = Field(default="mns", index=True)
    text: str
    
# ----- модель для библиотеки промптов (Playbook Engine) -----
class PromptTemplate(SQLModel, table=True):
    __tablename__ = "prompt_library_v3" 
    
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str 
    title: str
    text: str
    project_id: str = Field(default="mns", index=True)
    tags: str = Field(default="")

# ---- модель проектов ----
class Project(SQLModel, table=True):
    __tablename__ = "projects_v3"

    id: str = Field(primary_key=True)
    name: str = Field(default="")