import os
import json
import importlib
import importlib.metadata
import pkgutil
import logging


class ToolsScanner:

    def find_tool(self, class_name, package_name):
        """
        Recursively search through the target packages for the tool classes and their paths.
        """

        try:
            package = importlib.import_module(package_name)
            pkg_name = package.__name__
            pkg_path = package.__path__
            for module_info in pkgutil.walk_packages(pkg_path, pkg_name + "."):
                try:
                    module = importlib.import_module(module_info.name)
                    if hasattr(module, class_name):
                        return getattr(module, class_name)
                    if module_info.ispkg:
                        self.find_tool(
                            class_name=class_name, package_name=module_info.name
                        )

                except (ImportError, AttributeError, ModuleNotFoundError) as e:
                    continue
        except ImportError as e:
            # TODO: Need to log this error case here
            pass

        return None


if __name__ == "__main__":

    scanner = ToolsScanner()
    # TODO: Add logging

    if os.environ.get("IN_DOCKER"):
        tools_paths = scanner.load_tools_paths()
    else:
        tools_paths = scanner.perform_scanning()

    print(tools_paths)
