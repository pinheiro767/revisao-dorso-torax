from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

def carregar_dados():
    caminho = os.path.join("data", "musculos.json")
    with open(caminho, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/musculos")
def api_musculos():
    return jsonify(carregar_dados())

if __name__ == "__main__":
    app.run(debug=True)
