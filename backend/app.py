import os
import sys

from flask import Flask, jsonify, request, send_from_directory

# Support running both as `python backend/app.py` and `python -m backend.app`.
if __package__ is None or __package__ == "":
	sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.algorithms import schedule
from backend.flask_cors import CORS


BACKEND_DIR = os.path.dirname(__file__)
FRONTEND_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "..", "frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)


def _validate_processes(raw_processes):
	if not isinstance(raw_processes, list) or not raw_processes:
		raise ValueError("'processes' must be a non-empty list")

	validated = []
	for index, process in enumerate(raw_processes):
		if not isinstance(process, dict):
			raise ValueError(f"Process at index {index} must be an object")

		for field in ("id", "arrival", "burst"):
			if field not in process:
				raise ValueError(f"Process at index {index} is missing '{field}'")

		validated.append(
			{
				"id": str(process["id"]),
				"arrival": float(process["arrival"]),
				"burst": float(process["burst"]),
				"priority": float(process.get("priority", 0)),
			}
		)

	return validated


@app.route("/schedule", methods=["POST"])
def schedule_processes():
	payload = request.get_json(silent=True) or {}

	try:
		processes = _validate_processes(payload.get("processes"))
		algorithm = payload.get("algorithm")
		if not algorithm:
			raise ValueError("'algorithm' is required")

		quantum = payload.get("quantum", 1)
		response = schedule(processes, algorithm, quantum=quantum)
		return jsonify(response), 200
	except (TypeError, ValueError) as error:
		return jsonify({"error": str(error)}), 400


@app.route("/health", methods=["GET"])
def health_check():
	return jsonify({"status": "ok"}), 200


@app.route("/", methods=["GET"])
def serve_index():
	return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>", methods=["GET"])
def serve_frontend_assets(path):
	asset_path = os.path.join(FRONTEND_DIR, path)
	if os.path.isfile(asset_path):
		return send_from_directory(FRONTEND_DIR, path)
	return send_from_directory(FRONTEND_DIR, "index.html")


if __name__ == "__main__":
	app.run(host="127.0.0.1", port=5000, debug=True)