from flask import Flask
from blueprints.out_dbar_bp import out_dbar_bp
from blueprints.hyundai_bp import hyundai_bp
from blueprints.dongkuk_bp import dongkuk_bp

app = Flask(__name__)

app.register_blueprint(out_dbar_bp)
app.register_blueprint(hyundai_bp)
app.register_blueprint(dongkuk_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)