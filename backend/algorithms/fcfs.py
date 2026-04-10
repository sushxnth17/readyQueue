from .common import add_timeline_segment, clone_processes


def fcfs(processes):
    scheduled_processes = clone_processes(processes)
    scheduled_processes.sort(key=lambda item: item["arrival"])

    timeline = []
    time = 0

    for process in scheduled_processes:
        if time < process["arrival"]:
            time = process["arrival"]

        start = time
        end = start + process["burst"]
        process["startTime"] = start
        process["completionTime"] = end
        process["turnaroundTime"] = process["completionTime"] - process["arrival"]
        process["waitingTime"] = process["turnaroundTime"] - process["burst"]
        add_timeline_segment(timeline, process["id"], start, end)
        time = end

    return {
        "results": scheduled_processes,
        "timeline": timeline,
    }
