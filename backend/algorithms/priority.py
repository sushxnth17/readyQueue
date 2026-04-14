from .common import clone_processes


def priority(processes):
    def selection_rank(process):
        # Lower tuple value means higher scheduling priority.
        return (process["priority"], process["arrival"], process["id"])

    scheduled_processes = clone_processes(processes)
    for process in scheduled_processes:
        process["remainingTime"] = process["burst"]

    timeline = []
    time = 0
    completed = 0
    current_process = None

    def add_timeline_segment(process_id, start, end):
        last_segment = timeline[-1] if timeline else None
        if last_segment and last_segment["id"] == process_id and last_segment["end"] == start:
            last_segment["end"] = end
        else:
            timeline.append({"id": process_id, "start": start, "end": end})

    while completed < len(scheduled_processes):
        available_processes = [
            process for process in scheduled_processes if process["arrival"] <= time and process["remainingTime"] > 0
        ]

        if len(available_processes) == 0:
            time += 1
            current_process = None
            continue

        selected_process = min(available_processes, key=selection_rank)

        # Re-evaluate every time unit, but keep the current process when it remains the best candidate.
        if current_process in available_processes and selection_rank(current_process) <= selection_rank(selected_process):
            selected_process = current_process

        add_timeline_segment(selected_process["id"], time, time + 1)
        selected_process["remainingTime"] -= 1
        current_process = selected_process

        if selected_process["remainingTime"] == 0:
            selected_process["completionTime"] = time + 1
            selected_process["turnaroundTime"] = selected_process["completionTime"] - selected_process["arrival"]
            selected_process["waitingTime"] = selected_process["turnaroundTime"] - selected_process["burst"]
            completed += 1
            current_process = None

        time += 1

    return {
        "results": scheduled_processes,
        "timeline": timeline,
    }
