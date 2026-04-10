from .common import add_timeline_segment, clone_processes


def sjf(processes):
    pending_processes = clone_processes(processes)
    pending_processes.sort(key=lambda item: item["arrival"])

    ready_queue = []
    completed_processes = []
    timeline = []
    time = 0
    next_arrival_index = 0

    while len(completed_processes) < len(pending_processes):
        while next_arrival_index < len(pending_processes) and pending_processes[next_arrival_index]["arrival"] <= time:
            ready_queue.append(pending_processes[next_arrival_index])
            next_arrival_index += 1

        if len(ready_queue) == 0:
            time += 1
            continue

        ready_queue.sort(key=lambda item: (item["burst"], item["arrival"], item["id"]))
        current = ready_queue.pop(0)
        start = time
        end = start + current["burst"]
        current["startTime"] = start
        current["completionTime"] = end
        current["turnaroundTime"] = current["completionTime"] - current["arrival"]
        current["waitingTime"] = current["turnaroundTime"] - current["burst"]
        add_timeline_segment(timeline, current["id"], start, end)
        completed_processes.append(current)
        time = end

    return {
        "results": completed_processes,
        "timeline": timeline,
    }
