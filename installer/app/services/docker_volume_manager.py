import subprocess
from pathlib import Path
from datetime import datetime
class DockerVolumeManager:
    def __init__(self, export_path: str):
        self.export_path = Path(export_path)
        self.export_path.mkdir(parents=True, exist_ok=True)

    def ensure_docker_running(self) -> bool:
        try:
            subprocess.run(["docker", "info"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except subprocess.CalledProcessError:
            return False

    def export_volume(self, volume_name: str) -> Path:
        """Export Docker volume data to a .tar archive in the specified export path."""
        if not self.ensure_docker_running():
            raise RuntimeError("Docker is not running or could not be started.")

        current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_path = self.export_path / f"{volume_name}-{current_time}.tar"
        container_name = f"exporter_{volume_name}"

        try:
            print(f"Exporting volume '{volume_name}' to {archive_path}...")

            # Create a temporary container from a minimal image and export the volume
            subprocess.run([
                "docker", "run", "--rm", 
                "-v", f"{volume_name}:/data",
                "--name", container_name,
                "alpine",
                "tar", "cf", "-",
                "-C", "/data", "."
            ], check=True, stdout=open(archive_path, "wb"))

            print(f"Export complete: {archive_path}")
            return archive_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to export volume {volume_name}: {e}")

    def import_volume(self, volume_name: str, archive_path: str | Path) -> None:
        """Import data from a .tar archive into a Docker volume."""
        archive_path = Path(archive_path)
        if not archive_path.exists():
            raise FileNotFoundError(f"Archive not found: {archive_path}")
        
        if not self.ensure_docker_running():
            raise RuntimeError("Docker is not running or could not be started.")

        container_name = f"importer_{volume_name}"

        try:
            print(f"Importing archive {archive_path} into volume '{volume_name}'...")

            # Run an alpine container, mount the volume and the archive, extract it
            subprocess.run([
                "docker", "run", "--rm",
                "-v", f"{volume_name}:/data",
                "-v", f"{archive_path.absolute()}:/archive.tar:ro",
                "--name", container_name,
                "alpine",
                "sh", "-c", "cd /data && tar xf /archive.tar"
            ], check=True)

            print(f"Import complete: {volume_name}")
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to import archive into volume {volume_name}: {e}")