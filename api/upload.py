from fastapi import FastAPI, UploadFile, Form, File
import httpx
import os

app = FastAPI()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(None),
    child_name: str = Form(""),
    book_title: str = Form(""),
    email: str = Form(""),
    phone: str = Form(""),
    is_first: str = Form("false"),
    caption: str = Form("")
):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        # For local dev without env vars, just return success
        print("Telegram env vars not set, skipping message.")
        return {"status": "ok", "message": "Simulated success"}
        
    async with httpx.AsyncClient() as client:
        # If it's the first image, send contact info first
        if is_first == "true":
            text = f"🛍️ НОВЫЙ ЗАКАЗ!\n\nИмя ребенка: {child_name}\nНазвание книги: {book_title}\nEmail: {email}\nТелефон (WhatsApp): {phone}"
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                data={"chat_id": TELEGRAM_CHAT_ID, "text": text}
            )
            
        if file:
            content = await file.read()
            files = {"document": (file.filename, content, file.content_type)}
            data = {"chat_id": TELEGRAM_CHAT_ID}
            if caption:
                data["caption"] = caption
                
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendDocument",
                data=data,
                files=files
            )
            
    return {"status": "ok"}
