# Project Guidelines

## Code Style
- Use Python 3 syntax and keep scripts simple and readable.
- Prefer descriptive file and function names over numeric names for any new files.
- Add short comments only for non-obvious logic.

## Architecture
- This workspace is currently a minimal single-script project.
- Keep changes small and avoid introducing multi-module structure unless explicitly requested.

## Build and Test
- Run script: `python3 1.py`
- There is no configured dependency management, build pipeline, or test suite yet.

## Conventions
- Treat `1.py` as the current entry point unless the user asks to reorganize.
- If adding dependencies or tests, update this file and add a `README.md` to document commands.