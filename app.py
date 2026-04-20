from flask import Flask, render_template, jsonify
import json
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

def carregar_dados():
    caminho = os.path.join(BASE_DIR, "data", "musculos.json")
    with open(caminho, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/musculos")
def api_musculos():
    return jsonify(carregar_dados())

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

from flask import Flask, render_template, jsonify, send_from_directory
import json
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

def carregar_dados():
    caminho = os.path.join(BASE_DIR, "data", "musculos.json")
    with open(caminho, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/musculos")
def api_musculos():
    return jsonify(carregar_dados())

@app.route("/manifest.json")
def manifest():
    return send_from_directory(BASE_DIR, "manifest.json")

@app.route("/sw.js")
def service_worker():
    return send_from_directory(BASE_DIR, "sw.js", mimetype="application/javascript")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
