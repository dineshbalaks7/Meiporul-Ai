
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.querying import answer_question

from app.services.conversation_service import (
    create_conversation,
    save_message,
    get_conversation_history,
    conversation_exists,
    list_conversations,
    delete_conversation,
    rename_conversation,
    toggle_pin_conversation
)


router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


# Request schema
class ChatRequest(BaseModel):
    question: str
    document_id: str | None = None
    conversation_id: str | None = None


# 1. Chat with documents
@router.post("/")
def chat_with_documents(request: ChatRequest):

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:

        # Create a new conversation or validate an existing one
        if request.conversation_id:

            conversation_id = request.conversation_id

            if not conversation_exists(conversation_id):
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found."
                )

        else:
            conversation_id = create_conversation()

        # Retrieve previous conversation history
        chat_history = get_conversation_history(
            conversation_id,
            limit=10
        )

        # Generate context-aware answer
        result = answer_question(
            query=request.question,
            document_id=request.document_id,
            chat_history=chat_history
        )

        # Save user message and assistant response
        save_message(
            conversation_id,
            "user",
            request.question
        )

        save_message(
            conversation_id,
            "assistant",
            result["answer"],
            sources=result["sources"]
        )

        return {
            "conversation_id": conversation_id,
            "question": request.question,
            "document_id": request.document_id,
            "answer": result["answer"],
            "sources": result["sources"]
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# 2. Get conversation history
@router.get("/{conversation_id}/history")
def get_chat_history(conversation_id: str):

    if not conversation_exists(conversation_id):
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    history = get_conversation_history(
        conversation_id,
        limit=100
    )

    return {
        "conversation_id": conversation_id,
        "total_messages": len(history),
        "messages": history
    }


# 3. List all conversations
@router.get("/conversations")
def get_all_conversations():

    conversations = list_conversations()

    return {
        "total_conversations": len(conversations),
        "conversations": conversations
    }


# 4. Delete a conversation
@router.delete("/conversations/{conversation_id}")
def remove_conversation(conversation_id: str):

    deleted = delete_conversation(conversation_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    return {
        "message": "Conversation deleted successfully.",
        "conversation_id": conversation_id
    }


class RenameConversationRequest(BaseModel):
    title: str


# 5. Rename a conversation
@router.patch("/conversations/{conversation_id}/rename")
def update_conversation_title(conversation_id: str, request: RenameConversationRequest):

    if not conversation_exists(conversation_id):
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    success = rename_conversation(conversation_id, request.title)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to rename conversation."
        )

    return {
        "message": "Conversation renamed successfully.",
        "conversation_id": conversation_id,
        "title": request.title
    }


class PinConversationRequest(BaseModel):
    is_pinned: bool | None = None


# 6. Pin or unpin a conversation
@router.patch("/conversations/{conversation_id}/pin")
def pin_unpin_conversation(conversation_id: str, request: PinConversationRequest = None):

    if not conversation_exists(conversation_id):
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    is_pinned_val = request.is_pinned if request else None
    new_state = toggle_pin_conversation(conversation_id, is_pinned_val)

    if new_state is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to update pin status."
        )

    return {
        "message": "Pin status updated successfully.",
        "conversation_id": conversation_id,
        "is_pinned": new_state
    }
