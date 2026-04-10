from collections import deque

from .common import clone_processes


def rr(processes, quantum=1):
    if quantum is None:
        quantum = 1

    time_quantum = float(quantum)
    if time_quantum <= 0:
        raise ValueError("Time quantum must be a positive number.")

    scheduled_processes = clone_processes(processes)
    for process in scheduled_processes:
        process["remainingTime"] = process["burst"]
        process["completionTime"] = None
        process["turnaroundTime"] = None
        process["waitingTime"] = None
        process["inQueue"] = False

    scheduled_processes.sort(key=lambda item: (item["arrival"], item["id"]))

    queue = deque()
    timeline = []
    time = 0
    next_arrival_index = 0
    completed = 0

    def add_arrived_processes(up_to_time):
        nonlocal next_arrival_index
        while next_arrival_index < len(scheduled_processes) and scheduled_processes[next_arrival_index]["arrival"] <= up_to_time:
            arrived_process = scheduled_processes[next_arrival_index]
            if arrived_process["remainingTime"] > 0 and not arrived_process["inQueue"]:
                queue.append(arrived_process)
                arrived_process["inQueue"] = True
            next_arrival_index += 1

    def add_timeline_segment(process_id, start, end):
        last_segment = timeline[-1] if timeline else None
        if last_segment and last_segment["id"] == process_id and last_segment["end"] == start:
            last_segment["end"] = end
            return

        timeline.append({"id": process_id, "start": start, "end": end})

    while completed < len(scheduled_processes):
        add_arrived_processes(time)

        if len(queue) == 0:
            if next_arrival_index < len(scheduled_processes):
                time = max(time, scheduled_processes[next_arrival_index]["arrival"])
                add_arrived_processes(time)
            continue

        selected_process = queue.popleft()
        selected_process["inQueue"] = False

        start_time = time
        run_time = min(time_quantum, selected_process["remainingTime"])
        end_time = start_time + run_time

        add_timeline_segment(selected_process["id"], start_time, end_time)

        time = end_time
        selected_process["remainingTime"] -= run_time

        add_arrived_processes(time)

        if selected_process["remainingTime"] > 0:
            queue.append(selected_process)
            selected_process["inQueue"] = True
        else:
            selected_process["completionTime"] = time
            selected_process["turnaroundTime"] = selected_process["completionTime"] - selected_process["arrival"]
            selected_process["waitingTime"] = selected_process["turnaroundTime"] - selected_process["burst"]
            completed += 1

    for process in scheduled_processes:
        del process["inQueue"]

    return {
        "results": scheduled_processes,
        "timeline": timeline,
    }
