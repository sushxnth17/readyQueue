from .common import add_timeline_segment, clone_processes


def srtf(processes):
    def selection_rank(process):
        # Lower tuple value means higher scheduling priority.
        return (process["remainingTime"], process["arrival"], process["id"])

    scheduled_processes = clone_processes(processes)
    for process in scheduled_processes:
        process["remainingTime"] = process["burst"]

    timeline = []
    time = 0
    completed = 0
    current_process = None

    while completed < len(scheduled_processes):
        available_processes = [
            process for process in scheduled_processes if process["arrival"] <= time and process["remainingTime"] > 0
        ]

        if len(available_processes) == 0:
            time += 1
            continue

        best_candidate = min(available_processes, key=selection_rank)

        # Preempt only when another process has strictly smaller remaining time.
        if current_process in available_processes:
            if best_candidate["remainingTime"] < current_process["remainingTime"]:
                selected_process = best_candidate
            else:
                selected_process = current_process
        else:
            selected_process = best_candidate

        start_time = time
        end_time = time + 1

        add_timeline_segment(timeline, selected_process["id"], start_time, end_time)

        selected_process["remainingTime"] -= 1
        current_process = selected_process
        time += 1

        if selected_process["remainingTime"] == 0:
            selected_process["completionTime"] = time
            selected_process["turnaroundTime"] = selected_process["completionTime"] - selected_process["arrival"]
            selected_process["waitingTime"] = selected_process["turnaroundTime"] - selected_process["burst"]
            completed += 1
            current_process = None

    return {
        "results": scheduled_processes,
        "timeline": timeline,
    }
