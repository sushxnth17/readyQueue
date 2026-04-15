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

COMPARISON_ALGORITHMS = [
	("FCFS", "FCFS"),
	("SJF", "SJF"),
	("SRTF", "SRTF"),
	("RR", "Round Robin"),
	("PRIORITY", "Priority"),
]


def _validate_processes(raw_processes, require_priority=False):
	if not isinstance(raw_processes, list) or not raw_processes:
		raise ValueError("'processes' must be a non-empty list")

	validated = []
	for index, process in enumerate(raw_processes):
		if not isinstance(process, dict):
			raise ValueError(f"Process at index {index} must be an object")

		for field in ("id", "arrival", "burst"):
			if field not in process:
				raise ValueError(f"Process at index {index} is missing '{field}'")

		priority_value = process.get("priority")
		if require_priority and (priority_value is None or str(priority_value).strip() == ""):
			raise ValueError(f"Process at index {index} is missing 'priority'")

		validated.append(
			{
				"id": str(process["id"]),
				"arrival": float(process["arrival"]),
				"burst": float(process["burst"]),
				"priority": float(priority_value) if priority_value not in (None, "") else 0,
			}
		)

	return validated


def _validate_quantum(raw_quantum):
	if raw_quantum in (None, ""):
		raise ValueError("'quantum' is required for Round Robin")

	if isinstance(raw_quantum, bool):
		raise ValueError("'quantum' must be a positive integer")

	if isinstance(raw_quantum, float) and not raw_quantum.is_integer():
		raise ValueError("'quantum' must be a positive integer")

	try:
		quantum = int(raw_quantum)
	except (TypeError, ValueError):
		raise ValueError("'quantum' must be a positive integer") from None

	if quantum <= 0:
		raise ValueError("'quantum' must be a positive integer")

	return quantum


def _summarize_result(algorithm_label, response):
	results = response.get("results", [])
	if not results:
		return {
			"algorithm": algorithm_label,
			"averageTurnaroundTime": 0,
			"averageWaitingTime": 0,
		}

	turnaround_total = sum(float(result.get("turnaroundTime", 0)) for result in results)
	waiting_total = sum(float(result.get("waitingTime", 0)) for result in results)
	count = len(results)

	return {
		"algorithm": algorithm_label,
		"averageTurnaroundTime": turnaround_total / count,
		"averageWaitingTime": waiting_total / count,
	}


@app.route("/schedule", methods=["POST"])
def schedule_processes():
	payload = request.get_json(silent=True) or {}

	try:
		algorithm = payload.get("algorithm")
		if not algorithm:
			raise ValueError("'algorithm' is required")

		algorithm_name = str(algorithm).strip().upper()
		require_priority = algorithm_name in {"PRIORITY", "PREEMPTIVE PRIORITY"}
		processes = _validate_processes(payload.get("processes"), require_priority=require_priority)

		if algorithm_name in {"RR", "ROUND ROBIN"}:
			quantum = _validate_quantum(payload.get("quantum"))
		else:
			quantum = None

		response = schedule(processes, algorithm, quantum=quantum)
		return jsonify(response), 200
	except (TypeError, ValueError) as error:
		return jsonify({"error": str(error)}), 400


@app.route("/compare", methods=["POST"])
def compare_algorithms():
	payload = request.get_json(silent=True) or {}

	try:
		processes = _validate_processes(payload.get("processes"), require_priority=True)
		quantum = _validate_quantum(payload.get("quantum"))

		comparison = []
		for algorithm, label in COMPARISON_ALGORITHMS:
			if algorithm == "RR":
				response = schedule(processes, algorithm, quantum=quantum)
			else:
				response = schedule(processes, algorithm)

			comparison.append(_summarize_result(label, response))

		best_algorithm = min(
			comparison,
			key=lambda item: (item["averageWaitingTime"], item["averageTurnaroundTime"], item["algorithm"]),
		)

		return jsonify({
			"comparison": comparison,
			"bestAlgorithm": best_algorithm["algorithm"],
		}), 200
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