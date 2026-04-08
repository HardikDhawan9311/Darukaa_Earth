from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    full_name: str = Field(..., alias="fullName")
    email: EmailStr
    role: Optional[str] = "user"

    class Config:
        populate_by_name = True

# Used for receiving registration data
class UserCreate(UserBase):
    password: str
    confirmPassword: str

    class Config:
        json_schema_extra = {
            "example": {
                "fullName": "John Doe",
                "email": "johndoe@example.com",
                "password": "strongPassword123",
                "confirmPassword": "strongPassword123",
                "role": "user"
            }
        }

# Used for returning user data (without password)
class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # Enables converting SQLAlchemy models to Pydantic

# Used for receiving login data
class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True # Enables converting SQLAlchemy models to Pydantic
