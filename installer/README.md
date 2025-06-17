# EpicStaff Installer

A Docker container management tool for EpicStaff.

## Installation

```bash
poetry install
```

## Development

To build the application:

```bash
# Build the executable
pyinstaller installer.py --name epicstaff --onefile --add-data "app/templates:app/templates" --add-data "app/static:app/static" --hidden-import engineio.async_drivers.threading
# Run the built executable
./dist/epicstaff
```