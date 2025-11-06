from flask import Flask, render_template
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', '5000'))
    debug = os.getenv('DEBUG', 'True').lower() in ('1', 'true', 'yes')
    # Если SECRET_KEY задан в .env — устанавливаем для сессий/CSRF и т.п.
    secret_key = os.getenv('SECRET_KEY')
    if secret_key:
        app.secret_key = secret_key

    app.run(host=host, port=port, debug=debug)

