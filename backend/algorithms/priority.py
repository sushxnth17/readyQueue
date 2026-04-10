from .common import clone_processes


def priority(processes):
    scheduled_processes = clone_processes(processes)
    for process in scheduled_processes:
        process["remainingTime"] = process["burst"]

    timeline = []
    time = 0
    completed = 0

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
            continue

        selected_process = available_processes[0]
        for candidate in available_processes[1:]:
            if candidate["priority"] < selected_process["priority"]:
                selected_process = candidate
                continue

            if candidate["priority"] == selected_process["priority"]:
                if candidate["remainingTime"] < selected_process["remainingTime"]:
                    selected_process = candidate
                    continue

                if candidate["remainingTime"] == selected_process["remainingTime"]:
                    if candidate["arrival"] < selected_process["arrival"]:
                        selected_process = candidate
                        continue

                    if candidate["arrival"] == selected_process["arrival"] and candidate["id"] < selected_process["id"]:
                        selected_process = candidate

        add_timeline_segment(selected_process["id"], time, time + 1)
        selected_process["remainingTime"] -= 1

        if selected_process["remainingTime"] == 0:
            selected_process["completionTime"] = time + 1
            selected_process["turnaroundTime"] = selected_process["completionTime"] - selected_process["arrival"]
            selected_process["waitingTime"] = selected_process["turnaroundTime"] - selected_process["burst"]
            completed += 1

        time += 1

    return {
        "results": scheduled_processes,
        "timeline": timeline,
    }
