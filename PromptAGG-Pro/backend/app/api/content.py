from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from core.database import get_session
# 👇 ДОБАВИЛ ИМПОРТ Project СЮДА
from models.content_plan import ContentPlan, Idea, PromptTemplate, Project
from core.ws_manager import manager
# 👇 ИСПРАВИЛ НА БОЛЬШУЮ БУКВУ M
from pydantic import BaseModel

router = APIRouter(prefix="/content-plan", tags=["Content Plan"])

# --- эндпоинты для постов ---
@router.get("/", response_model=List[ContentPlan])
def get_posts(project_id: str = "mns", session: Session = Depends(get_session)):
    statement = select(ContentPlan).where(ContentPlan.project_id == project_id)
    results = session.exec(statement).all()
    return results

@router.post("/", response_model=ContentPlan)
async def create_post(post: ContentPlan, session: Session = Depends(get_session)):
    session.add(post)
    session.commit()
    session.refresh(post)
    await manager.broadcast("update_posts") # Оповещаем всех
    return post

@router.put("/{post_id}", response_model=ContentPlan)
async def update_post(post_id: int, update_post: ContentPlan, session: Session = Depends(get_session)):
    post = session.get(ContentPlan, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")
    
    post.topic = update_post.topic
    post.publish_date = update_post.publish_date
    post.platforms = update_post.platforms
    
    session.add(post)
    session.commit()
    session.refresh(post)
    await manager.broadcast("update_posts") # Оповещаем всех
    return post

@router.delete("/{post_id}")
async def delete_post(post_id: int, session: Session = Depends(get_session)):
    post = session.get(ContentPlan, post_id)
    if post:
        session.delete(post)
        session.commit()
        await manager.broadcast("update_posts") # Оповещаем всех
    return {"message": "Пост удален"}

# --- эндпоинты для багажа идей ---
@router.get("/ideas/", response_model=List[Idea])
def get_idea(project_id: str = "mns", session: Session = Depends(get_session)):
    statement = select(Idea).where(Idea.project_id == project_id)
    results = session.exec(statement).all()
    return results

@router.post("/ideas/", response_model=Idea)
async def create_idea(idea: Idea, session: Session = Depends(get_session)):
    session.add(idea)
    session.commit()
    session.refresh(idea)
    await manager.broadcast("update_posts") # Оповещаем всех
    return idea

@router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: int, session: Session = Depends(get_session)):
    idea = session.get(Idea, idea_id)
    if idea:
        session.delete(idea)
        session.commit()
        await manager.broadcast("update_posts") # Оповещаем всех
    return {"message": "Идея удалена"}

# --- эндпоинты для библиотеки промптов ---
@router.get("/library/", response_model=List[PromptTemplate])
def get_library(session: Session = Depends(get_session)):
    statement = select(PromptTemplate)
    results = session.exec(statement).all() 
    return results

@router.post("/library/", response_model=PromptTemplate)
async def create_library_prompt(prompt: PromptTemplate, session: Session = Depends(get_session)):
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    await manager.broadcast("update_posts") # Оповещаем всех
    return prompt

@router.delete("/library/{prompt_id}")
async def delete_library_prompt(prompt_id: int, session: Session = Depends(get_session)):
    prompt = session.get(PromptTemplate, prompt_id)
    if prompt:
        session.delete(prompt)
        session.commit()
        await manager.broadcast("update_posts") # Оповещаем всех
    return {"message": "Шаблон удалён"}

class ProjectCreate(BaseModel):
    id: str
    name: str

# --- Эндпоинты для проектов ---
@router.get("/projects/")
def get_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    # Если база проектов пустая, создаем базовые по умолчанию
    if not projects:
        default_projects = [
            Project(id="mns", name="MNS"),
            Project(id="moshelovka", name="MOSHELOVKA"),
            Project(id="nelimita", name="NELIMITA")
        ]
        for p in default_projects:
            session.add(p)
        session.commit()
        return default_projects
    return projects

@router.post("/projects/")
def create_project(project: ProjectCreate, session: Session = Depends(get_session)):
    new_project = Project(id=project.id.lower(), name=project.name)
    session.add(new_project)
    session.commit()
    return new_project

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if project:
        session.delete(project)
    
    # 2. Удаляем все посты этого проекта
    posts = session.exec(select(ContentPlan).where(ContentPlan.project_id == project_id)).all()
    for post in posts:
        session.delete(post)
        
    # 3. Удаляем все идеи этого проекта
    ideas = session.exec(select(Idea).where(Idea.project_id == project_id)).all()
    for idea in ideas:
        session.delete(idea)
        
    session.commit()
    return {"status": "deleted"}