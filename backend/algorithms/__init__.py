from .fcfs import fcfs
from .priority import priority
from .rr import rr
from .sjf import sjf
from .srtf import srtf


ALGORITHMS = {
    "FCFS": fcfs,
    "SJF": sjf,
    "SRTF": srtf,
    "RR": rr,
    "PRIORITY": priority,
    "ROUND ROBIN": rr,
    "PREEMPTIVE PRIORITY": priority,
}


def schedule(processes, algorithm, quantum=None):
    algorithm_name = str(algorithm).strip().upper()
    if algorithm_name not in ALGORITHMS:
        raise ValueError(f"Unsupported algorithm: {algorithm}")

    scheduler = ALGORITHMS[algorithm_name]
    if algorithm_name == "RR":
        return scheduler(processes, quantum=quantum)
    return scheduler(processes)
