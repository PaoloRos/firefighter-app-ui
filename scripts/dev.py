"""Run the frontend and backend development servers together."""

from __future__ import annotations

import os
from pathlib import Path
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent.parent
COMMANDS = (
    (
        "backend",
        (
            str(ROOT / "backend" / ".venv" / "bin" / "python"),
            "-m",
            "firefighter_tools_backend",
        ),
        ROOT / "backend",
    ),
    (
        "frontend",
        (
            str(ROOT / "frontend" / "node_modules" / ".bin" / "vite"),
            "--host",
            "127.0.0.1",
        ),
        ROOT / "frontend",
    ),
)


def stop(processes: list[subprocess.Popen[bytes]]) -> None:
    """Stop every development server and wait for process cleanup."""
    for process in processes:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)

    deadline = time.monotonic() + 5
    for process in processes:
        try:
            process.wait(timeout=max(0, deadline - time.monotonic()))
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()


def main() -> int:
    """Start both servers and stop both when either one exits."""
    missing_commands = [
        command[0]
        for _, command, _ in COMMANDS
        if os.sep in command[0] and not Path(command[0]).is_file()
    ]
    if missing_commands:
        print(
            "Missing development dependency: " + ", ".join(missing_commands),
            file=sys.stderr,
        )
        print("Create backend/.venv and install the backend first.", file=sys.stderr)
        return 1

    processes: list[subprocess.Popen[bytes]] = []
    try:
        for name, command, working_directory in COMMANDS:
            print(f"Starting {name}: {' '.join(command)}", flush=True)
            processes.append(
                subprocess.Popen(
                    command,
                    cwd=working_directory,
                    start_new_session=True,
                )
            )

        while all(process.poll() is None for process in processes):
            time.sleep(0.2)

        return next(
            (process.returncode for process in processes if process.returncode),
            0,
        )
    except KeyboardInterrupt:
        return 130
    finally:
        stop(processes)


if __name__ == "__main__":
    raise SystemExit(main())
