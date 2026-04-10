def as_number(value):
    number = float(value)
    return int(number) if number.is_integer() else number


def clone_processes(processes):
    cloned = []
    for process in processes:
        cloned.append(
            {
                "id": str(process["id"]),
                "arrival": as_number(process["arrival"]),
                "burst": as_number(process["burst"]),
                "priority": as_number(process.get("priority", 0)),
            }
        )
    return cloned


def normalize_processes(processes):
    return clone_processes(processes)


def add_timeline_segment(timeline, process_id, start, end):
    if start >= end:
        return

    if timeline and timeline[-1]["id"] == process_id and timeline[-1]["end"] == start:
        timeline[-1]["end"] = end
        return

    timeline.append({"id": process_id, "start": start, "end": end})


def build_results(processes):
    ordered_processes = sorted(processes, key=lambda item: item["index"])
    results = []

    for process in ordered_processes:
        completion = process["completion"]
        turnaround = completion - process["arrival"]
        waiting = turnaround - process["burst"]
        response = process["first_start"] - process["arrival"] if process["first_start"] is not None else 0
        results.append(
            {
                "id": process["id"],
                "arrival": process["arrival"],
                "burst": process["burst"],
                "priority": process["priority"],
                "completion": completion,
                "turnaround": turnaround,
                "waiting": waiting,
                "response": response,
            }
        )

    return results
