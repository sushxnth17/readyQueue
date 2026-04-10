from flask import Flask, jsonify, request

from backend.algorithms import schedule
from backend.flask_cors import CORS


app = Flask(__name__)
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


@app.route("/", methods=["GET"])
def health_check():
	return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
	app.run(host="127.0.0.1", port=5000, debug=True)