
import sqlite3

from pathlib import Path


DB_PATH = Path("data/chat_history.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.execute("PRAGMA foreign_keys = ON")
    return connection

def initialize_chat_database():

    with get_connection() as connection:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                conversation_id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sources TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id)
                    REFERENCES conversations(conversation_id)
            )
        """)

        # Add sources column if upgrading an existing database
        cursor = connection.execute("PRAGMA table_info(messages)")
        columns = [row[1] for row in cursor.fetchall()]
        if "sources" not in columns:
            try:
                connection.execute("ALTER TABLE messages ADD COLUMN sources TEXT DEFAULT NULL")
            except Exception:
                pass

        # Add title and is_pinned columns to conversations if upgrading
        cursor_conv = connection.execute("PRAGMA table_info(conversations)")
        conv_columns = [row[1] for row in cursor_conv.fetchall()]
        if "title" not in conv_columns:
            try:
                connection.execute("ALTER TABLE conversations ADD COLUMN title TEXT DEFAULT NULL")
            except Exception:
                pass
        if "is_pinned" not in conv_columns:
            try:
                connection.execute("ALTER TABLE conversations ADD COLUMN is_pinned INTEGER DEFAULT 0")
            except Exception:
                pass


initialize_chat_database()


import uuid


def create_conversation():

    conversation_id = str(uuid.uuid4())

    with get_connection() as connection:

        connection.execute(
            """
            INSERT INTO conversations (conversation_id)
            VALUES (?)
            """,
            (conversation_id,)
        )

    return conversation_id


import json


def save_message(conversation_id, role, content, sources=None):

    sources_str = json.dumps(sources) if sources is not None else None

    with get_connection() as connection:

        connection.execute(
            """
            INSERT INTO messages (
                conversation_id,
                role,
                content,
                sources
            )
            VALUES (?, ?, ?, ?)
            """,
            (conversation_id, role, content, sources_str)
        )


def get_conversation_history(conversation_id, limit=10):

    with get_connection() as connection:

        cursor = connection.execute(
            """
            SELECT role, content, sources
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (conversation_id, limit)
        )

        messages = cursor.fetchall()

    # Return messages in chronological order
    messages.reverse()

    results = []
    for role, content, sources_raw in messages:
        msg = {
            "role": role,
            "content": content
        }
        if sources_raw:
            try:
                msg["sources"] = json.loads(sources_raw)
            except Exception:
                msg["sources"] = []
        results.append(msg)

    return results


def conversation_exists(conversation_id):

    with get_connection() as connection:

        cursor = connection.execute(
            """
            SELECT 1
            FROM conversations
            WHERE conversation_id = ?
            """,
            (conversation_id,)
        )

        return cursor.fetchone() is not None


def list_conversations():

    with get_connection() as connection:

        cursor = connection.execute(
            """
            SELECT
                c.conversation_id,
                c.created_at,
                COALESCE(
                    c.title,
                    (
                        SELECT content
                        FROM messages
                        WHERE conversation_id = c.conversation_id
                        AND role = 'user'
                        ORDER BY id ASC
                        LIMIT 1
                    ),
                    'New conversation'
                ) AS title,
                (
                    SELECT COUNT(*)
                    FROM messages
                    WHERE conversation_id = c.conversation_id
                ) AS total_messages,
                (
                    SELECT content
                    FROM messages
                    WHERE conversation_id = c.conversation_id
                    ORDER BY id DESC
                    LIMIT 1
                ) AS last_message,
                COALESCE(c.is_pinned, 0) AS is_pinned
            FROM conversations c
            ORDER BY c.is_pinned DESC, c.created_at DESC
            """
        )

        records = cursor.fetchall()

    return [
        {
            "conversation_id": row[0],
            "created_at": row[1],
            "title": row[2] or "New conversation",
            "total_messages": row[3],
            "last_message": row[4],
            "is_pinned": bool(row[5])
        }
        for row in records
    ]


def rename_conversation(conversation_id, new_title):

    with get_connection() as connection:

        cursor = connection.execute(
            """
            UPDATE conversations
            SET title = ?
            WHERE conversation_id = ?
            """,
            (new_title.strip() if new_title else None, conversation_id)
        )

        return cursor.rowcount > 0


def toggle_pin_conversation(conversation_id, is_pinned=None):

    with get_connection() as connection:

        if is_pinned is not None:
            new_val = 1 if is_pinned else 0
        else:
            cursor = connection.execute(
                "SELECT COALESCE(is_pinned, 0) FROM conversations WHERE conversation_id = ?",
                (conversation_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            new_val = 0 if row[0] == 1 else 1

        cursor = connection.execute(
            """
            UPDATE conversations
            SET is_pinned = ?
            WHERE conversation_id = ?
            """,
            (new_val, conversation_id)
        )

        if cursor.rowcount > 0:
            return bool(new_val)

        return None


def delete_conversation(conversation_id):

    with get_connection() as connection:

        cursor = connection.execute(
            """
            SELECT 1
            FROM conversations
            WHERE conversation_id = ?
            """,
            (conversation_id,)
        )

        if cursor.fetchone() is None:
            return False

        # Delete all messages belonging to this conversation
        connection.execute(
            """
            DELETE FROM messages
            WHERE conversation_id = ?
            """,
            (conversation_id,)
        )

        # Delete the conversation
        connection.execute(
            """
            DELETE FROM conversations
            WHERE conversation_id = ?
            """,
            (conversation_id,)
        )

    return True


def delete_all_conversations():
    """Remove every stored conversation and its messages, returning the count."""
    with get_connection() as connection:
        cursor = connection.execute("SELECT COUNT(*) FROM conversations")
        count = cursor.fetchone()[0]
        connection.execute("DELETE FROM messages")
        connection.execute("DELETE FROM conversations")
    return count

