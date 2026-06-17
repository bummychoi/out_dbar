from flask import Flask
from blueprints.out_dbar_bp import out_dbar_bp

app = Flask(__name__)

app.register_blueprint(out_dbar_bp)

if __name__ == "__main__":
    app.run(debug=True, port=8000)