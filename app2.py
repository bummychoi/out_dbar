import os
import threading
import subprocess
import webbrowser

from flask import Flask
from blueprints.out_dbar_bp import out_dbar_bp
from blueprints.hyundai_bp import hyundai_bp
from blueprints.dongkuk_bp import dongkuk_bp

app = Flask(__name__)

app.register_blueprint(out_dbar_bp)
app.register_blueprint(hyundai_bp)
app.register_blueprint(dongkuk_bp)


def open_browser():
    url = "http://127.0.0.1:5001/out_dbar/"

    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]

    for chrome in chrome_paths:
        if os.path.exists(chrome):
            subprocess.Popen([chrome, url])
            return

    webbrowser.open(url)


if __name__ == "__main__":
    threading.Timer(1.5, open_browser).start()

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True,
        use_reloader=False
    )