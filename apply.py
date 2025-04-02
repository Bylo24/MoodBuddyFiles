import json
import re
import os
import sys

def filter_messages(data):
    return [message for message in data if message["role"] == "assistant"]

def extract_code_blocks(content):
    # Find all code blocks with filepath attribute
    pattern = r'<code filepath=[\'"]([^\'"]+)[\'"]>(.*?)</code>'
    matches = re.findall(pattern, content, re.DOTALL)
    
    # Create a dictionary mapping filepaths to code contents
    file_changes = {}
    for filepath, code in matches:
        file_changes[filepath] = code.strip()
    
    return file_changes

def write_file_changes(file_changes):
    for filepath, content in file_changes.items():
        # Handle files in root directory vs subdirectories
        dirname = os.path.dirname(filepath)
        if dirname:  # Only create directories if there's a directory path
            os.makedirs(dirname, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            print(f"Written file: {filepath}")  # Add debug logging for successful writes

def commit_changes(file_changes, message_index):
    files_changed = list(file_changes.keys())
    commit_message = f"Applied changes from message {message_index}. Modified files: {', '.join(files_changed)}"
    
    # Execute git commands and capture output
    add_output = os.popen('git add ' + ' '.join(files_changed)).read()
    commit_output = os.popen(f'git commit -m "{commit_message}"').read()
    
    # Print debug information
    print("\nGit operation details:")
    print("Files staged:", ' '.join(files_changed))
    print("Commit output:", commit_output.strip())
    
    # Verify the commit was made
    last_commit = os.popen('git log -1 --oneline').read()
    print("Last commit:", last_commit.strip())

def apply_changes(messages, start_index=0):
    for i, message in enumerate(messages[start_index:], start=start_index):
        print(f"\nProcessing message at index {i}")
        
        # Extract code blocks from the message
        file_changes = extract_code_blocks(message["content"])
        
        if not file_changes:
            print("No code changes found in this message. Skipping...")
            continue
        
        # Print the changes that will be made one file at a time
        print(f"\nFound {len(file_changes)} files to be modified.")
        
        for filepath, content in file_changes.items():
            print(f"\nFile: {filepath}")
            print("Content:")
            print(content)
            print("-" * 80)
            print("Press Enter to see next file, or 'c' to cancel: ")
            
            response = input().lower()
            if response == 'c':
                print("Changes review cancelled. Exiting program.")
                sys.exit(0)
        
        # After showing all files, ask for final confirmation
        print("\nAll files have been reviewed.")
        response = input("Press Enter to apply these changes, anything else to skip: ")
        
        if response == '':
            write_file_changes(file_changes)
            commit_changes(file_changes, i)
            print(f"Changes from message at index {i} applied and committed successfully.")
        else:
            print("Changes skipped. Moving to next message...")
            continue

def main():
    # Check if a start index was provided
    start_index = 0
    if len(sys.argv) > 1:
        try:
            start_index = int(sys.argv[1])
        except ValueError:
            print("Invalid start index provided. Using 0.")
    
    with open("messages.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    relevant_messages = filter_messages(data)
    
    # Validate start_index
    if start_index >= len(relevant_messages):
        print(f"Start index {start_index} is out of range. Maximum index is {len(relevant_messages) - 1}")
        sys.exit(1)
    
    apply_changes(relevant_messages, start_index)

if __name__ == "__main__":
    main()

