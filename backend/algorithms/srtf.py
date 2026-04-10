from .common import add_timeline_segment, clone_processes


def srtf(processes):
    scheduled_processes = clone_processes(processes)
    for process in scheduled_processes:
        process["remainingTime"] = process["burst"]

    timeline = []
    time = 0
    completed = 0

    while completed < len(scheduled_processes):
        available_processes = [
            process for process in scheduled_processes if process["arrival"] <= time and process["remainingTime"] > 0
        ]

        if len(available_processes) == 0:
            time += 1
            continue

        available_processes.sort(key=lambda item: (item["remainingTime"], item["arrival"], item["id"]))
        selected_process = available_processes[0]
        start_time = time
        end_time = time + 1

        last_segment = timeline[-1] if timeline else None
        if last_segment and last_segment["id"] == selected_process["id"] and last_segment["end"] == start_time:
            last_segment["end"] = end_time
        else:
            timeline.append({"id": selected_process["id"], "start": start_time, "end": end_time})

        selected_process["remainingTime"] -= 1
        time += 1

        if selected_process["remainingTime"] == 0:
            selected_process["completionTime"] = time
            selected_process["turnaroundTime"] = selected_process["completionTime"] - selected_process["arrival"]
            selected_process["waitingTime"] = selected_process["turnaroundTime"] - selected_process["burst"]
            completed += 1

    return {
        "results": scheduled_processes,
        "timeline": timeline,
    }
