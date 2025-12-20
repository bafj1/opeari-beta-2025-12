
import os

file_path = 'src/pages/Waitlist.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Start of the toggle block
    if '{/* Referral Code Toggle */}' in line:
        new_lines.append(line)
        new_lines.append("                {(referralSource === '' || referralSource === 'referral_code') && (\n")
        continue

    # Identify the end of the toggle block. 
    # The block starts with <div className="mb-4"> (which is the line AFTER the comment usually, or close to it)
    # We need to find where this div ends. 
    # Based on indentation, the div closing tag should be indented similarly.
    # The block contains the Expand button and the Input div.
    
    # Looking at the previous context: 
    # 528: <div className="mb-4">
    # ... content ...
    # 545: </div>  <-- End of that div
    
    # However, determining the specific closing </div> by generic parsing is flaky.
    # Safe anchor: The next block starts with `showReferralName`.
    
    # We can look for the line BEFORE `{(showReferralName &&`
    if '{(showReferralName &&' in line:
        # Close the condition before this new block starts
        new_lines.append("                )}\n")
        new_lines.append('\n')
        new_lines.append(line)
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Successfully conditionally wrapped Referral Code Toggle")
