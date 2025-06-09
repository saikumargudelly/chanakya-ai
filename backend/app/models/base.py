from datetime import datetime
from typing import Any, Optional
from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.ext.declarative import as_declarative, declared_attr

@as_declarative()
class Base:
    id: Any
    __name__: str
    
    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()
    
    # Timestamp for record creation
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Timestamp for record updates
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete flag
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
