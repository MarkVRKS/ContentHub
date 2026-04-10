from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .content_plan import ContentPlan

class PromptHistory(SQLModel, table=True):
    __tablename__ = "prompt_history"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    prompt_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    content_plan_id: int = Field(foreign_key="content_plan.id")
    
    content_item: Optional["ContentPlan"] = Relationship(back_populates="prompts")