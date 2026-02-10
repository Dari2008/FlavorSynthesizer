import os
import sys
import json

def list_files_with_sizes(directory):
    if not os.path.isdir(directory):
        raise ValueError(f"Invalid directory: {directory}")

    result = {}

    for entry in os.scandir(directory):
        if entry.is_file():
            result[entry.name] = entry.stat().st_size

    return result


def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <directory>")
        sys.exit(1)

    directory = sys.argv[1]
    data = list_files_with_sizes(directory)

    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
