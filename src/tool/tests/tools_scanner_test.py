
from fixtures import create_temporary_package_structure
from tools_scanner import ToolsScanner



def test_find_tool_class_found(create_temporary_package_structure):
    """
    Test that `find_tool` correctly finds `TestClass` in `test_package.test_module`.
    """

    package = create_temporary_package_structure
    scanner = ToolsScanner()
    result = scanner.find_tool("TestClass", package)
    assert result is not None
    assert result.__name__ == "TestClass"

def test_find_tool_class_not_found(create_temporary_package_structure):
    """
    Test that `find_tool` returns None if the class does not exist in the package.
    """
    package = create_temporary_package_structure

    scanner = ToolsScanner()
    result = scanner.find_tool("NonExistentClass", package)
    
    assert result is None

def test_find_tool_package_not_found(create_temporary_package_structure):
    """
    Test that `find_tool` returns None if the class does not exist in the package.
    """
    scanner = ToolsScanner()
    result = scanner.find_tool("TestClass", "nonexistent_package")
    
    assert result is None