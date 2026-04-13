from collections import deque

from .common import add_timeline_segment, clone_processes


def rr(processes, quantum):
	if isinstance(quantum, bool):
		raise ValueError("'quantum' must be a positive integer")

	if isinstance(quantum, float) and not quantum.is_integer():
		raise ValueError("'quantum' must be a positive integer")

	try:
		time_quantum = int(quantum)
	except (TypeError, ValueError):
		raise ValueError("'quantum' must be a positive integer") from None

	if time_quantum <= 0:
		raise ValueError("'quantum' must be a positive integer")

	scheduled_processes = clone_processes(processes)
	for process in scheduled_processes:
		process["remainingTime"] = process["burst"]

	scheduled_processes.sort(key=lambda item: (item["arrival"], item["id"]))

	timeline = []
	ready_queue = deque()
	current_time = 0
	next_arrival_index = 0
	completed_count = 0
	total_processes = len(scheduled_processes)

	while completed_count < total_processes:
		while (
			next_arrival_index < total_processes
			and scheduled_processes[next_arrival_index]["arrival"] <= current_time
		):
			ready_queue.append(scheduled_processes[next_arrival_index])
			next_arrival_index += 1

		if not ready_queue:
			if next_arrival_index < total_processes:
				current_time = max(current_time, scheduled_processes[next_arrival_index]["arrival"])
				continue
			break

		current_process = ready_queue.popleft()
		run_time = min(time_quantum, current_process["remainingTime"])
		start_time = current_time
		end_time = current_time + run_time

		add_timeline_segment(timeline, current_process["id"], start_time, end_time)

		current_time = end_time
		current_process["remainingTime"] -= run_time

		while (
			next_arrival_index < total_processes
			and scheduled_processes[next_arrival_index]["arrival"] <= current_time
		):
			ready_queue.append(scheduled_processes[next_arrival_index])
			next_arrival_index += 1

		if current_process["remainingTime"] > 0:
			ready_queue.append(current_process)
		else:
			current_process["completionTime"] = current_time
			current_process["turnaroundTime"] = current_process["completionTime"] - current_process["arrival"]
			current_process["waitingTime"] = current_process["turnaroundTime"] - current_process["burst"]
			completed_count += 1

	return {
		"results": scheduled_processes,
		"timeline": timeline,
	}
