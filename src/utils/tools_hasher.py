import os
import hashlib

class ToolsHasher:
    """
    A utility class to handle hashing of package metadata and storing/retrieving hash values
    from a file to detect changes in installed packages.
    """

    hash_file_path = "config/packages_hash.txt"

    def __init__(self):
        """Initialize an instance of the ToolsHasher class."""
        pass

    def compute_packages_hash(self, packages_dict):
        """
        Compute the hash of the installed packages.
        """
        packages_list = sorted(f"{k}=={v}" for k, v in packages_dict.items())
        packages_str = '\n'.join(packages_list)
        return hashlib.md5(packages_str.encode('utf-8')).hexdigest()

    def load_saved_hash(self):
        """
        Load the saved hash from the file, if it exists.
        """
        if os.path.exists(self.hash_file_path):
            with open(self.hash_file_path, 'r') as f:
                return f.read().strip()
        return None

    def save_current_hash(self, hash_value):
        """
        Save the computed hash to the hash file.
        """
        with open(self.hash_file_path, 'w') as f:
            f.write(hash_value)
