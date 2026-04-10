from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        # Список всех активных "трубок" (соединений)
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # Рассылаем сообщение ВСЕМ подключенным пользователям
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Если кто-то закрыл вкладку, просто пропускаем
                pass

manager = ConnectionManager()